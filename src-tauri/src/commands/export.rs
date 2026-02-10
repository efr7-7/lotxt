use base64::Engine;
use chrono::Utc;
use docx_rs::*;
use printpdf::*;
use serde::{Deserialize, Serialize};
use std::io::BufWriter;

use crate::db;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentMeta {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub word_count: i64,
    pub project_id: Option<String>,
    pub status: String,
    pub character_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct StationDocument {
    version: String,
    id: String,
    title: String,
    content: String,
    html_content: String,
    created_at: String,
    updated_at: String,
}

// ---------------------------------------------------------------------------
// Helpers – lightweight HTML ➜ structured-node parser
// ---------------------------------------------------------------------------

#[derive(Debug, Clone)]
enum HtmlNode {
    Heading { level: u8, children: Vec<InlineNode> },
    Paragraph { children: Vec<InlineNode> },
    UnorderedList { items: Vec<Vec<InlineNode>> },
    OrderedList { items: Vec<Vec<InlineNode>> },
    Blockquote { children: Vec<InlineNode> },
    CodeBlock { text: String },
    HorizontalRule,
    Table { rows: Vec<Vec<Vec<InlineNode>>> },
    Image { src: String, alt: String },
}

#[derive(Debug, Clone)]
struct InlineNode {
    text: String,
    bold: bool,
    italic: bool,
    underline: bool,
    code: bool,
}

/// Very small, purpose-built HTML parser.  It handles the subset produced by
/// Tiptap / ProseMirror (well-formed, no nesting surprises).
fn parse_html(html: &str) -> Vec<HtmlNode> {
    let mut nodes: Vec<HtmlNode> = Vec::new();
    let html = html.trim();

    // We work on a character level.  We pull out top-level block elements and
    // then parse their inner content for inline formatting.
    let mut pos = 0;
    let chars: Vec<char> = html.chars().collect();
    let len = chars.len();

    while pos < len {
        // Skip whitespace between blocks
        while pos < len && chars[pos].is_whitespace() {
            pos += 1;
        }
        if pos >= len {
            break;
        }

        if chars[pos] == '<' {
            // Read the tag name
            let tag_start = pos;
            if let Some(tag_info) = read_opening_tag(&chars, pos) {
                let tag_name = tag_info.name.to_lowercase();
                pos = tag_info.end;

                match tag_name.as_str() {
                    "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
                        let level = tag_name[1..].parse::<u8>().unwrap_or(1);
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_name) {
                            nodes.push(HtmlNode::Heading {
                                level,
                                children: parse_inline(&inner),
                            });
                            pos = end;
                        }
                    }
                    "p" => {
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "p") {
                            nodes.push(HtmlNode::Paragraph {
                                children: parse_inline(&inner),
                            });
                            pos = end;
                        }
                    }
                    "ul" => {
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "ul") {
                            nodes.push(HtmlNode::UnorderedList {
                                items: parse_list_items(&inner),
                            });
                            pos = end;
                        }
                    }
                    "ol" => {
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "ol") {
                            nodes.push(HtmlNode::OrderedList {
                                items: parse_list_items(&inner),
                            });
                            pos = end;
                        }
                    }
                    "blockquote" => {
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "blockquote") {
                            // Blockquote may contain <p> – flatten
                            let stripped = strip_tags_simple(&inner, "p");
                            nodes.push(HtmlNode::Blockquote {
                                children: parse_inline(&stripped),
                            });
                            pos = end;
                        }
                    }
                    "pre" => {
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "pre") {
                            // Strip inner <code> tag if present
                            let code_text = strip_tags_simple(&inner, "code");
                            nodes.push(HtmlNode::CodeBlock {
                                text: decode_html_entities(&code_text),
                            });
                            pos = end;
                        }
                    }
                    "hr" => {
                        nodes.push(HtmlNode::HorizontalRule);
                        // hr may be self-closing already handled by read_opening_tag
                    }
                    "table" => {
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "table") {
                            nodes.push(parse_table(&inner));
                            pos = end;
                        }
                    }
                    "img" => {
                        let src = tag_info
                            .attrs
                            .iter()
                            .find(|(k, _)| k == "src")
                            .map(|(_, v)| v.clone())
                            .unwrap_or_default();
                        let alt = tag_info
                            .attrs
                            .iter()
                            .find(|(k, _)| k == "alt")
                            .map(|(_, v)| v.clone())
                            .unwrap_or_default();
                        nodes.push(HtmlNode::Image { src, alt });
                    }
                    "div" | "section" | "article" | "main" | "header" | "footer" => {
                        // Wrapper tags – recurse into children
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_name) {
                            let inner_nodes = parse_html(&inner);
                            nodes.extend(inner_nodes);
                            pos = end;
                        }
                    }
                    "br" => {
                        // Self-closing – skip
                    }
                    _ => {
                        // Unknown tag – try to skip past it
                        if let Some((_, end)) = read_until_closing(&chars, pos, &tag_name) {
                            pos = end;
                        }
                    }
                }
            } else {
                // Could not parse tag – skip character
                pos = tag_start + 1;
            }
        } else {
            // Plain text outside any block tag – wrap in paragraph
            let start = pos;
            while pos < len && chars[pos] != '<' {
                pos += 1;
            }
            let text: String = chars[start..pos].iter().collect();
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                nodes.push(HtmlNode::Paragraph {
                    children: vec![InlineNode {
                        text: decode_html_entities(trimmed),
                        bold: false,
                        italic: false,
                        underline: false,
                        code: false,
                    }],
                });
            }
        }
    }

    nodes
}

struct TagInfo {
    name: String,
    end: usize,
    attrs: Vec<(String, String)>,
}

fn read_opening_tag(chars: &[char], start: usize) -> Option<TagInfo> {
    if start >= chars.len() || chars[start] != '<' {
        return None;
    }
    let mut pos = start + 1;
    // skip whitespace
    while pos < chars.len() && chars[pos].is_whitespace() {
        pos += 1;
    }
    // Check for closing tag
    if pos < chars.len() && chars[pos] == '/' {
        return None;
    }
    // Read tag name
    let name_start = pos;
    while pos < chars.len() && !chars[pos].is_whitespace() && chars[pos] != '>' && chars[pos] != '/' {
        pos += 1;
    }
    let name: String = chars[name_start..pos].iter().collect();
    if name.is_empty() {
        return None;
    }

    // Read attributes
    let mut attrs = Vec::new();
    loop {
        while pos < chars.len() && chars[pos].is_whitespace() {
            pos += 1;
        }
        if pos >= chars.len() {
            break;
        }
        if chars[pos] == '>' {
            pos += 1;
            break;
        }
        if chars[pos] == '/' {
            pos += 1;
            if pos < chars.len() && chars[pos] == '>' {
                pos += 1;
            }
            break;
        }
        // Read attribute name
        let attr_start = pos;
        while pos < chars.len()
            && !chars[pos].is_whitespace()
            && chars[pos] != '='
            && chars[pos] != '>'
            && chars[pos] != '/'
        {
            pos += 1;
        }
        let attr_name: String = chars[attr_start..pos].iter().collect();
        // Skip =
        while pos < chars.len() && chars[pos].is_whitespace() {
            pos += 1;
        }
        if pos < chars.len() && chars[pos] == '=' {
            pos += 1;
            while pos < chars.len() && chars[pos].is_whitespace() {
                pos += 1;
            }
            // Read value
            if pos < chars.len() && (chars[pos] == '"' || chars[pos] == '\'') {
                let quote = chars[pos];
                pos += 1;
                let val_start = pos;
                while pos < chars.len() && chars[pos] != quote {
                    pos += 1;
                }
                let val: String = chars[val_start..pos].iter().collect();
                if pos < chars.len() {
                    pos += 1; // skip closing quote
                }
                attrs.push((attr_name.to_lowercase(), val));
            } else {
                // Unquoted value
                let val_start = pos;
                while pos < chars.len()
                    && !chars[pos].is_whitespace()
                    && chars[pos] != '>'
                    && chars[pos] != '/'
                {
                    pos += 1;
                }
                let val: String = chars[val_start..pos].iter().collect();
                attrs.push((attr_name.to_lowercase(), val));
            }
        } else if !attr_name.is_empty() {
            attrs.push((attr_name.to_lowercase(), String::new()));
        }
    }

    Some(TagInfo {
        name: name.to_lowercase(),
        end: pos,
        attrs,
    })
}

/// Read content until the matching closing tag.  Returns (inner_html, position_after_closing_tag).
fn read_until_closing(chars: &[char], start: usize, tag: &str) -> Option<(String, usize)> {
    let close_tag = format!("</{}>", tag);
    let _close_tag_upper = format!("</{}>", tag.to_uppercase());
    let mut pos = start;
    let mut depth = 1;

    while pos < chars.len() {
        if chars[pos] == '<' {
            // Check for closing tag
            let remainder: String = chars[pos..].iter().take(close_tag.len() + 5).collect();
            let remainder_lower = remainder.to_lowercase();
            if remainder_lower.starts_with(&close_tag) {
                depth -= 1;
                if depth == 0 {
                    let inner: String = chars[start..pos].iter().collect();
                    return Some((inner, pos + close_tag.len()));
                }
            }
            // Check for another opening of same tag
            let open_pattern = format!("<{}", tag);
            if remainder_lower.starts_with(&open_pattern) {
                // Make sure it's actually an opening tag (not something like <pre-something>)
                let next_char_pos = pos + open_pattern.len();
                if next_char_pos < chars.len()
                    && (chars[next_char_pos].is_whitespace()
                        || chars[next_char_pos] == '>'
                        || chars[next_char_pos] == '/')
                {
                    depth += 1;
                }
            }
        }
        pos += 1;
    }

    // If we didn't find closing tag, return rest
    let inner: String = chars[start..].iter().collect();
    Some((inner, chars.len()))
}

fn parse_list_items(html: &str) -> Vec<Vec<InlineNode>> {
    let mut items = Vec::new();
    let chars: Vec<char> = html.chars().collect();
    let mut pos = 0;

    while pos < chars.len() {
        if chars[pos] == '<' {
            if let Some(tag_info) = read_opening_tag(&chars, pos) {
                if tag_info.name == "li" {
                    pos = tag_info.end;
                    if let Some((inner, end)) = read_until_closing(&chars, pos, "li") {
                        // Strip inner <p> tags
                        let stripped = strip_tags_simple(&inner, "p");
                        items.push(parse_inline(&stripped));
                        pos = end;
                        continue;
                    }
                }
            }
        }
        pos += 1;
    }
    items
}

fn parse_inline(html: &str) -> Vec<InlineNode> {
    let mut nodes = Vec::new();
    let chars: Vec<char> = html.chars().collect();
    let mut pos = 0;

    // Inline context stack
    let bold = false;
    let italic = false;
    let underline = false;
    let code = false;

    while pos < chars.len() {
        if chars[pos] == '<' {
            if let Some(tag_info) = read_opening_tag(&chars, pos) {
                match tag_info.name.as_str() {
                    "strong" | "b" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_info.name)
                        {
                            // Recurse with bold flag
                            let inner_nodes = parse_inline_with_flags(&inner, true, italic, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "em" | "i" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_info.name)
                        {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, true, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "u" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "u") {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, italic, true, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "code" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "code") {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, italic, underline, true);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "a" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "a") {
                            // Treat link text as regular inline with underline
                            let inner_nodes =
                                parse_inline_with_flags(&inner, bold, italic, true, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "br" => {
                        nodes.push(InlineNode {
                            text: "\n".to_string(),
                            bold,
                            italic,
                            underline,
                            code,
                        });
                        pos = tag_info.end;
                        continue;
                    }
                    "span" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "span") {
                            let inner_nodes =
                                parse_inline_with_flags(&inner, bold, italic, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    _ => {
                        // Skip unknown inline tags
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_info.name)
                        {
                            let inner_nodes =
                                parse_inline_with_flags(&inner, bold, italic, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                }
            } else {
                // Might be a closing tag we can skip
                // Find the next >
                while pos < chars.len() && chars[pos] != '>' {
                    pos += 1;
                }
                if pos < chars.len() {
                    pos += 1;
                }
                continue;
            }
        } else {
            // Regular text
            let start = pos;
            while pos < chars.len() && chars[pos] != '<' {
                pos += 1;
            }
            let text: String = chars[start..pos].iter().collect();
            if !text.is_empty() {
                nodes.push(InlineNode {
                    text: decode_html_entities(&text),
                    bold,
                    italic,
                    underline,
                    code,
                });
            }
        }
    }
    nodes
}

fn parse_inline_with_flags(
    html: &str,
    bold: bool,
    italic: bool,
    underline: bool,
    code: bool,
) -> Vec<InlineNode> {
    let chars: Vec<char> = html.chars().collect();
    let mut nodes = Vec::new();
    let mut pos = 0;

    while pos < chars.len() {
        if chars[pos] == '<' {
            if let Some(tag_info) = read_opening_tag(&chars, pos) {
                match tag_info.name.as_str() {
                    "strong" | "b" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_info.name) {
                            let inner_nodes = parse_inline_with_flags(&inner, true, italic, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "em" | "i" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_info.name) {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, true, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "u" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "u") {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, italic, true, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "code" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "code") {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, italic, underline, true);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "a" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "a") {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, italic, true, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    "br" => {
                        nodes.push(InlineNode {
                            text: "\n".to_string(),
                            bold,
                            italic,
                            underline,
                            code,
                        });
                        pos = tag_info.end;
                        continue;
                    }
                    "span" => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, "span") {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, italic, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                    _ => {
                        pos = tag_info.end;
                        if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_info.name) {
                            let inner_nodes = parse_inline_with_flags(&inner, bold, italic, underline, code);
                            nodes.extend(inner_nodes);
                            pos = end;
                            continue;
                        }
                    }
                }
            } else {
                while pos < chars.len() && chars[pos] != '>' {
                    pos += 1;
                }
                if pos < chars.len() {
                    pos += 1;
                }
                continue;
            }
        } else {
            let start = pos;
            while pos < chars.len() && chars[pos] != '<' {
                pos += 1;
            }
            let text: String = chars[start..pos].iter().collect();
            if !text.is_empty() {
                nodes.push(InlineNode {
                    text: decode_html_entities(&text),
                    bold,
                    italic,
                    underline,
                    code,
                });
            }
        }
    }
    nodes
}

fn strip_tags_simple(html: &str, tag: &str) -> String {
    let open = format!("<{}", tag);
    let close = format!("</{}>", tag);
    let mut result = html.to_string();

    // Remove closing tags
    while let Some(idx) = result.to_lowercase().find(&close) {
        result = format!("{}{}", &result[..idx], &result[idx + close.len()..]);
    }

    // Remove opening tags (which may have attributes)
    loop {
        let lower = result.to_lowercase();
        if let Some(idx) = lower.find(&open) {
            // Find the closing >
            if let Some(end) = result[idx..].find('>') {
                result = format!("{}{}", &result[..idx], &result[idx + end + 1..]);
            } else {
                break;
            }
        } else {
            break;
        }
    }
    result
}

fn parse_table(html: &str) -> HtmlNode {
    let mut rows: Vec<Vec<Vec<InlineNode>>> = Vec::new();

    // Strip <thead>, <tbody>, <tfoot> wrappers
    let html = strip_tags_simple(html, "thead");
    let html = strip_tags_simple(&html, "tbody");
    let html = strip_tags_simple(&html, "tfoot");

    let chars: Vec<char> = html.chars().collect();
    let mut pos = 0;

    while pos < chars.len() {
        if chars[pos] == '<' {
            if let Some(tag_info) = read_opening_tag(&chars, pos) {
                if tag_info.name == "tr" {
                    pos = tag_info.end;
                    if let Some((inner, end)) = read_until_closing(&chars, pos, "tr") {
                        let cells = parse_table_row(&inner);
                        rows.push(cells);
                        pos = end;
                        continue;
                    }
                }
            }
        }
        pos += 1;
    }

    HtmlNode::Table { rows }
}

fn parse_table_row(html: &str) -> Vec<Vec<InlineNode>> {
    let mut cells: Vec<Vec<InlineNode>> = Vec::new();
    let chars: Vec<char> = html.chars().collect();
    let mut pos = 0;

    while pos < chars.len() {
        if chars[pos] == '<' {
            if let Some(tag_info) = read_opening_tag(&chars, pos) {
                if tag_info.name == "td" || tag_info.name == "th" {
                    pos = tag_info.end;
                    if let Some((inner, end)) = read_until_closing(&chars, pos, &tag_info.name) {
                        let stripped = strip_tags_simple(&inner, "p");
                        cells.push(parse_inline(&stripped));
                        pos = end;
                        continue;
                    }
                }
            }
        }
        pos += 1;
    }
    cells
}

fn decode_html_entities(text: &str) -> String {
    text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&nbsp;", " ")
        .replace("&#x27;", "'")
        .replace("&#x2F;", "/")
        .replace("&mdash;", "\u{2014}")
        .replace("&ndash;", "\u{2013}")
        .replace("&hellip;", "\u{2026}")
        .replace("&lsquo;", "\u{2018}")
        .replace("&rsquo;", "\u{2019}")
        .replace("&ldquo;", "\u{201C}")
        .replace("&rdquo;", "\u{201D}")
}

/// Count words in plain text (strips all HTML).
fn count_words(html: &str) -> u64 {
    let mut in_tag = false;
    let mut text = String::new();
    for ch in html.chars() {
        if ch == '<' {
            in_tag = true;
            text.push(' ');
        } else if ch == '>' {
            in_tag = false;
        } else if !in_tag {
            text.push(ch);
        }
    }
    text.split_whitespace().count() as u64
}

// documents_dir and autosave_dir removed — documents now stored in SQLite

// ---------------------------------------------------------------------------
// DOCX export
// ---------------------------------------------------------------------------

fn inline_nodes_to_runs(children: &[InlineNode]) -> Vec<Run> {
    children
        .iter()
        .map(|node| {
            let mut run = Run::new().add_text(&node.text);
            if node.bold {
                run = run.bold();
            }
            if node.italic {
                run = run.italic();
            }
            if node.underline {
                run = run.underline("single");
            }
            if node.code {
                run = run.fonts(RunFonts::new().ascii("Courier New"));
            }
            run
        })
        .collect()
}

fn build_docx(title: &str, html: &str) -> Result<Vec<u8>, String> {
    let nodes = parse_html(html);
    let mut docx = Docx::new();

    // Title
    let title_para = Paragraph::new()
        .add_run(Run::new().add_text(title).bold().size(48))
        .align(AlignmentType::Center);
    docx = docx.add_paragraph(title_para);

    // Spacer
    docx = docx.add_paragraph(Paragraph::new());

    for node in &nodes {
        match node {
            HtmlNode::Heading { level, children } => {
                let size = match level {
                    1 => 36,
                    2 => 30,
                    3 => 26,
                    _ => 24,
                };
                let mut para = Paragraph::new();
                for child in children {
                    let mut run = Run::new().add_text(&child.text).size(size * 2).bold();
                    if child.italic {
                        run = run.italic();
                    }
                    if child.underline {
                        run = run.underline("single");
                    }
                    para = para.add_run(run);
                }
                docx = docx.add_paragraph(para);
            }
            HtmlNode::Paragraph { children } => {
                let mut para = Paragraph::new();
                for run in inline_nodes_to_runs(children) {
                    para = para.add_run(run);
                }
                docx = docx.add_paragraph(para);
            }
            HtmlNode::UnorderedList { items } => {
                for item_children in items {
                    let mut para = Paragraph::new();
                    // Add bullet character as prefix
                    let bullet_run = Run::new().add_text("\u{2022}  ");
                    para = para.add_run(bullet_run);
                    for run in inline_nodes_to_runs(item_children) {
                        para = para.add_run(run);
                    }
                    para = para.indent(Some(720), None, None, None);
                    docx = docx.add_paragraph(para);
                }
            }
            HtmlNode::OrderedList { items } => {
                for (i, item_children) in items.iter().enumerate() {
                    let mut para = Paragraph::new();
                    let num_run = Run::new().add_text(&format!("{}. ", i + 1));
                    para = para.add_run(num_run);
                    for run in inline_nodes_to_runs(item_children) {
                        para = para.add_run(run);
                    }
                    para = para.indent(Some(720), None, None, None);
                    docx = docx.add_paragraph(para);
                }
            }
            HtmlNode::Blockquote { children } => {
                let mut para = Paragraph::new();
                para = para.indent(Some(720), None, None, None);
                for child in children {
                    let mut run = Run::new().add_text(&child.text).italic();
                    if child.bold {
                        run = run.bold();
                    }
                    para = para.add_run(run);
                }
                docx = docx.add_paragraph(para);
            }
            HtmlNode::CodeBlock { text } => {
                for line in text.lines() {
                    let para = Paragraph::new()
                        .add_run(
                            Run::new()
                                .add_text(line)
                                .fonts(RunFonts::new().ascii("Courier New")),
                        )
                        .indent(Some(360), None, None, None);
                    docx = docx.add_paragraph(para);
                }
            }
            HtmlNode::HorizontalRule => {
                let para = Paragraph::new()
                    .add_run(Run::new().add_text("________________________________________"));
                docx = docx.add_paragraph(para);
            }
            HtmlNode::Table { rows } => {
                if rows.is_empty() {
                    continue;
                }
                let col_count = rows.iter().map(|r| r.len()).max().unwrap_or(0);
                if col_count == 0 {
                    continue;
                }

                let mut table = Table::new(Vec::new());
                for row_cells in rows {
                    let mut cells: Vec<TableCell> = Vec::new();
                    for cell_inlines in row_cells {
                        let mut para = Paragraph::new();
                        for run in inline_nodes_to_runs(cell_inlines) {
                            para = para.add_run(run);
                        }
                        cells.push(TableCell::new().add_paragraph(para));
                    }
                    // Pad missing cells
                    for _ in row_cells.len()..col_count {
                        cells.push(TableCell::new().add_paragraph(Paragraph::new()));
                    }
                    table = table.add_row(TableRow::new(cells));
                }
                docx = docx.add_table(table);
            }
            HtmlNode::Image { src, alt } => {
                // For images, include a placeholder with the alt text
                let display = if alt.is_empty() { "[Image]" } else { alt };
                let para = Paragraph::new()
                    .add_run(Run::new().add_text(display).italic())
                    .align(AlignmentType::Center);
                docx = docx.add_paragraph(para);

                // If it's a base64 data URI, try to embed the image
                if src.starts_with("data:image/png;base64,") || src.starts_with("data:image/jpeg;base64,") {
                    let base64_data = if let Some(data) = src.split(",").nth(1) {
                        data
                    } else {
                        continue;
                    };
                    if let Ok(image_bytes) = base64::engine::general_purpose::STANDARD.decode(base64_data) {
                        let pic = Pic::new(&image_bytes)
                            .size(400 * 9525, 300 * 9525); // ~400x300 px in EMU
                        let para = Paragraph::new()
                            .add_run(Run::new().add_image(pic))
                            .align(AlignmentType::Center);
                        docx = docx.add_paragraph(para);
                    }
                }
            }
        }
    }

    let mut buf = Vec::new();
    docx.build()
        .pack(&mut std::io::Cursor::new(&mut buf))
        .map_err(|e| format!("Failed to build DOCX: {}", e))?;
    Ok(buf)
}

// ---------------------------------------------------------------------------
// PDF export
// ---------------------------------------------------------------------------

/// A4 dimensions in mm
const A4_WIDTH_MM: f32 = 210.0;
const A4_HEIGHT_MM: f32 = 297.0;

/// Margins in mm
const MARGIN_LEFT: f32 = 25.0;
const MARGIN_RIGHT: f32 = 25.0;
const MARGIN_TOP: f32 = 25.0;
const MARGIN_BOTTOM: f32 = 25.0;

/// Usable width in mm
const USABLE_WIDTH: f32 = A4_WIDTH_MM - MARGIN_LEFT - MARGIN_RIGHT;

/// Points per mm (1pt = 0.3528mm, so 1mm ≈ 2.8346pt)
const PT_PER_MM: f32 = 2.8346;

struct PdfWriter {
    doc: PdfDocumentReference,
    current_page: PdfPageIndex,
    current_layer: PdfLayerIndex,
    y_pos: f32,         // current y position in mm from bottom
    font_regular: IndirectFontRef,
    font_bold: IndirectFontRef,
    font_italic: IndirectFontRef,
    font_bold_italic: IndirectFontRef,
    font_mono: IndirectFontRef,
    page_count: usize,
}

impl PdfWriter {
    fn new(title: &str) -> Result<Self, String> {
        let (doc, page_idx, layer_idx) = PdfDocument::new(
            title,
            Mm(A4_WIDTH_MM),
            Mm(A4_HEIGHT_MM),
            "Layer 1",
        );

        let font_regular = doc
            .add_builtin_font(BuiltinFont::Helvetica)
            .map_err(|e| format!("Failed to add Helvetica font: {}", e))?;
        let font_bold = doc
            .add_builtin_font(BuiltinFont::HelveticaBold)
            .map_err(|e| format!("Failed to add Helvetica-Bold font: {}", e))?;
        let font_italic = doc
            .add_builtin_font(BuiltinFont::HelveticaOblique)
            .map_err(|e| format!("Failed to add Helvetica-Oblique font: {}", e))?;
        let font_bold_italic = doc
            .add_builtin_font(BuiltinFont::HelveticaBoldOblique)
            .map_err(|e| format!("Failed to add Helvetica-BoldOblique font: {}", e))?;
        let font_mono = doc
            .add_builtin_font(BuiltinFont::Courier)
            .map_err(|e| format!("Failed to add Courier font: {}", e))?;

        Ok(PdfWriter {
            doc,
            current_page: page_idx,
            current_layer: layer_idx,
            y_pos: A4_HEIGHT_MM - MARGIN_TOP,
            font_regular,
            font_bold,
            font_italic,
            font_bold_italic,
            font_mono,
            page_count: 1,
        })
    }

    fn new_page(&mut self) {
        let (page_idx, layer_idx) = self.doc.add_page(
            Mm(A4_WIDTH_MM),
            Mm(A4_HEIGHT_MM),
            &format!("Layer {}", self.page_count + 1),
        );
        self.current_page = page_idx;
        self.current_layer = layer_idx;
        self.y_pos = A4_HEIGHT_MM - MARGIN_TOP;
        self.page_count += 1;
    }

    fn ensure_space(&mut self, needed_mm: f32) {
        if self.y_pos - needed_mm < MARGIN_BOTTOM {
            self.new_page();
        }
    }

    fn select_font(&self, bold: bool, italic: bool, code: bool) -> &IndirectFontRef {
        if code {
            return &self.font_mono;
        }
        match (bold, italic) {
            (true, true) => &self.font_bold_italic,
            (true, false) => &self.font_bold,
            (false, true) => &self.font_italic,
            (false, false) => &self.font_regular,
        }
    }

    /// Approximate width of a string in mm for a given font size (pt).
    /// Built-in Helvetica has ~600 units per 1000 average char width.
    fn approx_text_width_mm(&self, text: &str, font_size_pt: f32, is_mono: bool) -> f32 {
        let avg_char_width_ratio = if is_mono { 0.60 } else { 0.52 };
        let char_width_pt = font_size_pt * avg_char_width_ratio;
        let char_width_mm = char_width_pt / PT_PER_MM;
        text.chars().count() as f32 * char_width_mm
    }

    /// Wrap text into lines that fit within the given width in mm.
    fn wrap_text(&self, text: &str, font_size_pt: f32, max_width_mm: f32, is_mono: bool) -> Vec<String> {
        let mut lines = Vec::new();

        for hard_line in text.split('\n') {
            let words: Vec<&str> = hard_line.split_whitespace().collect();
            if words.is_empty() {
                lines.push(String::new());
                continue;
            }

            let mut current_line = String::new();
            for word in &words {
                let test = if current_line.is_empty() {
                    word.to_string()
                } else {
                    format!("{} {}", current_line, word)
                };
                if self.approx_text_width_mm(&test, font_size_pt, is_mono) > max_width_mm
                    && !current_line.is_empty()
                {
                    lines.push(current_line);
                    current_line = word.to_string();
                } else {
                    current_line = test;
                }
            }
            if !current_line.is_empty() {
                lines.push(current_line);
            }
        }

        if lines.is_empty() {
            lines.push(String::new());
        }
        lines
    }

    /// Write a single line of text at the current y position.
    fn write_line(&mut self, text: &str, font_size_pt: f32, font: &IndirectFontRef, x_offset_mm: f32) {
        let layer = self.doc.get_page(self.current_page).get_layer(self.current_layer);
        layer.use_text(
            text,
            font_size_pt,
            Mm(MARGIN_LEFT + x_offset_mm),
            Mm(self.y_pos),
            font,
        );
    }

    /// Write inline nodes as a block, with word-wrapping.
    fn write_inline_block(
        &mut self,
        children: &[InlineNode],
        font_size_pt: f32,
        indent_mm: f32,
        prefix: Option<&str>,
    ) {
        let line_height_mm = font_size_pt / PT_PER_MM * 1.4;
        let max_width = USABLE_WIDTH - indent_mm;

        // Concatenate all inline text for simple wrapping.
        // For mixed formatting, we do a simplified approach: concatenate text,
        // wrap, then for each output line re-render with approximate formatting.
        // A fully faithful approach would need per-character width measurement,
        // which is impractical with built-in fonts.

        let mut full_text = String::new();
        if let Some(pfx) = prefix {
            full_text.push_str(pfx);
        }
        for child in children {
            full_text.push_str(&child.text);
        }

        let is_mono = children.iter().any(|c| c.code);
        let lines = self.wrap_text(&full_text, font_size_pt, max_width, is_mono);

        for line in &lines {
            self.ensure_space(line_height_mm);

            // Determine dominant formatting from the first non-empty child
            let (bold, italic, code) = children
                .iter()
                .find(|c| !c.text.is_empty())
                .map(|c| (c.bold, c.italic, c.code))
                .unwrap_or((false, false, false));

            let font = self.select_font(bold, italic, code).clone();
            self.write_line(line, font_size_pt, &font, indent_mm);
            self.y_pos -= line_height_mm;
        }
    }

    fn write_spacer(&mut self, mm: f32) {
        self.y_pos -= mm;
        if self.y_pos < MARGIN_BOTTOM {
            self.new_page();
        }
    }

    fn finish(self) -> Result<Vec<u8>, String> {
        let mut buf = BufWriter::new(Vec::new());
        self.doc
            .save(&mut buf)
            .map_err(|e| format!("Failed to save PDF: {}", e))?;
        buf.into_inner()
            .map_err(|e| format!("Failed to finalize PDF buffer: {}", e))
    }
}

fn build_pdf(title: &str, html: &str) -> Result<Vec<u8>, String> {
    let nodes = parse_html(html);
    let mut w = PdfWriter::new(title)?;

    // Title
    let title_font = w.font_bold.clone();
    let title_lines = w.wrap_text(title, 20.0, USABLE_WIDTH, false);
    for line in &title_lines {
        w.ensure_space(20.0 / PT_PER_MM * 1.5);
        w.write_line(line, 20.0, &title_font, 0.0);
        w.y_pos -= 20.0 / PT_PER_MM * 1.5;
    }
    w.write_spacer(6.0);

    // Horizontal rule under title
    {
        let layer = w.doc.get_page(w.current_page).get_layer(w.current_layer);
        let line = printpdf::Line {
            points: vec![
                (printpdf::Point::new(Mm(MARGIN_LEFT), Mm(w.y_pos)), false),
                (
                    printpdf::Point::new(Mm(A4_WIDTH_MM - MARGIN_RIGHT), Mm(w.y_pos)),
                    false,
                ),
            ],
            is_closed: false,
        };
        let outline_color = printpdf::Color::Rgb(Rgb::new(0.7, 0.7, 0.7, None));
        layer.set_outline_color(outline_color);
        layer.set_outline_thickness(0.5);
        layer.add_line(line);
    }
    w.write_spacer(6.0);

    for node in &nodes {
        match node {
            HtmlNode::Heading { level, children } => {
                let font_size = match level {
                    1 => 18.0_f32,
                    2 => 15.0,
                    3 => 13.0,
                    _ => 12.0,
                };
                w.write_spacer(3.0);
                // Force bold for headings
                let modified: Vec<InlineNode> = children
                    .iter()
                    .map(|c| InlineNode {
                        bold: true,
                        ..c.clone()
                    })
                    .collect();
                w.write_inline_block(&modified, font_size, 0.0, None);
                w.write_spacer(2.0);
            }
            HtmlNode::Paragraph { children } => {
                w.write_inline_block(children, 11.0, 0.0, None);
                w.write_spacer(3.0);
            }
            HtmlNode::UnorderedList { items } => {
                for item_children in items {
                    w.write_inline_block(item_children, 11.0, 8.0, Some("\u{2022}  "));
                    w.write_spacer(1.5);
                }
                w.write_spacer(2.0);
            }
            HtmlNode::OrderedList { items } => {
                for (i, item_children) in items.iter().enumerate() {
                    let prefix = format!("{}. ", i + 1);
                    w.write_inline_block(item_children, 11.0, 8.0, Some(&prefix));
                    w.write_spacer(1.5);
                }
                w.write_spacer(2.0);
            }
            HtmlNode::Blockquote { children } => {
                // Draw a left bar
                {
                    let bar_x = MARGIN_LEFT + 3.0;
                    let bar_top = w.y_pos + 2.0;
                    // Estimate height
                    let est_lines = children.len().max(1);
                    let bar_bottom = w.y_pos - (est_lines as f32 * 11.0 / PT_PER_MM * 1.4) - 2.0;

                    let layer = w.doc.get_page(w.current_page).get_layer(w.current_layer);
                    let line = printpdf::Line {
                        points: vec![
                            (printpdf::Point::new(Mm(bar_x), Mm(bar_top)), false),
                            (printpdf::Point::new(Mm(bar_x), Mm(bar_bottom.max(MARGIN_BOTTOM))), false),
                        ],
                        is_closed: false,
                    };
                    let gray = printpdf::Color::Rgb(Rgb::new(0.6, 0.6, 0.6, None));
                    layer.set_outline_color(gray);
                    layer.set_outline_thickness(1.5);
                    layer.add_line(line);
                }
                // Make all children italic
                let modified: Vec<InlineNode> = children
                    .iter()
                    .map(|c| InlineNode {
                        italic: true,
                        ..c.clone()
                    })
                    .collect();
                w.write_inline_block(&modified, 11.0, 10.0, None);
                w.write_spacer(3.0);
            }
            HtmlNode::CodeBlock { text } => {
                w.write_spacer(2.0);
                let lines = text.lines();
                for line in lines {
                    let code_node = InlineNode {
                        text: line.to_string(),
                        bold: false,
                        italic: false,
                        underline: false,
                        code: true,
                    };
                    w.write_inline_block(&[code_node], 9.0, 6.0, None);
                }
                w.write_spacer(3.0);
            }
            HtmlNode::HorizontalRule => {
                w.write_spacer(3.0);
                {
                    let layer = w.doc.get_page(w.current_page).get_layer(w.current_layer);
                    let line = printpdf::Line {
                        points: vec![
                            (printpdf::Point::new(Mm(MARGIN_LEFT), Mm(w.y_pos)), false),
                            (
                                printpdf::Point::new(Mm(A4_WIDTH_MM - MARGIN_RIGHT), Mm(w.y_pos)),
                                false,
                            ),
                        ],
                        is_closed: false,
                    };
                    let gray = printpdf::Color::Rgb(Rgb::new(0.75, 0.75, 0.75, None));
                    layer.set_outline_color(gray);
                    layer.set_outline_thickness(0.5);
                    layer.add_line(line);
                }
                w.write_spacer(3.0);
            }
            HtmlNode::Table { rows } => {
                // Simple table rendering: render each cell as plain text rows
                w.write_spacer(2.0);
                for row_cells in rows {
                    let mut row_text = String::new();
                    for (i, cell) in row_cells.iter().enumerate() {
                        if i > 0 {
                            row_text.push_str("  |  ");
                        }
                        let cell_text: String =
                            cell.iter().map(|n| n.text.clone()).collect::<Vec<_>>().join("");
                        row_text.push_str(&cell_text);
                    }
                    let node = InlineNode {
                        text: row_text,
                        bold: false,
                        italic: false,
                        underline: false,
                        code: false,
                    };
                    w.write_inline_block(&[node], 10.0, 0.0, None);
                    w.write_spacer(1.0);
                }
                w.write_spacer(2.0);
            }
            HtmlNode::Image { alt, .. } => {
                let display = if alt.is_empty() {
                    "[Image]".to_string()
                } else {
                    format!("[Image: {}]", alt)
                };
                let node = InlineNode {
                    text: display,
                    bold: false,
                    italic: true,
                    underline: false,
                    code: false,
                };
                w.write_inline_block(&[node], 10.0, 0.0, None);
                w.write_spacer(3.0);
            }
        }
    }

    w.finish()
}

// ---------------------------------------------------------------------------
// Tauri Commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn export_docx(title: String, html_content: String) -> Result<Vec<u8>, String> {
    tokio::task::spawn_blocking(move || build_docx(&title, &html_content))
        .await
        .map_err(|e| format!("Export task failed: {}", e))?
}

#[tauri::command]
pub async fn export_pdf(title: String, html_content: String) -> Result<Vec<u8>, String> {
    tokio::task::spawn_blocking(move || build_pdf(&title, &html_content))
        .await
        .map_err(|e| format!("Export task failed: {}", e))?
}

// ---------------------------------------------------------------------------
// Document commands — SQLite backed
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn save_document(
    app: tauri::AppHandle,
    id: String,
    title: String,
    content: String,
    html_content: String,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();
    let wc = count_words(&html_content) as i64;

    // Check if exists to preserve created_at
    let existing_created: Option<String> = conn
        .query_row(
            "SELECT created_at FROM documents WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .ok();

    let created_at = existing_created.unwrap_or_else(|| now.clone());

    // Get current version
    let current_version: i64 = conn
        .query_row(
            "SELECT COALESCE(version, 0) FROM documents WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    let new_version = current_version + 1;

    conn.execute(
        "INSERT OR REPLACE INTO documents (id, title, content, html_content, project_id, status, word_count, character_count, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4,
                 COALESCE((SELECT project_id FROM documents WHERE id = ?1), NULL),
                 COALESCE((SELECT status FROM documents WHERE id = ?1), 'draft'),
                 ?5, 0, ?6, ?7, ?8)",
        rusqlite::params![id, title, content, html_content, wc, new_version, created_at, now],
    )
    .map_err(|e| format!("Failed to save document: {}", e))?;

    // Save version snapshot
    conn.execute(
        "INSERT INTO document_versions (document_id, title, content, html_content, version, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![id, title, content, html_content, new_version, now],
    ).ok();

    // Keep only last 50 versions
    conn.execute(
        "DELETE FROM document_versions WHERE document_id = ?1 AND id NOT IN (SELECT id FROM document_versions WHERE document_id = ?1 ORDER BY version DESC LIMIT 50)",
        rusqlite::params![id],
    ).ok();

    db::log_activity(&conn, "document.saved", "document", Some(&id), None);

    Ok(())
}

#[tauri::command]
pub async fn load_document(app: tauri::AppHandle, id: String) -> Result<String, String> {
    let conn = db::get_db(&app)?;

    let result = conn.query_row(
        "SELECT id, title, content, html_content, created_at, updated_at FROM documents WHERE id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(StationDocument {
                version: "1.0".to_string(),
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                html_content: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    ).map_err(|_| format!("Document '{}' not found", id))?;

    serde_json::to_string(&result).map_err(|e| format!("Serialization failed: {}", e))
}

#[tauri::command]
pub async fn list_documents(app: tauri::AppHandle) -> Result<Vec<DocumentMeta>, String> {
    let conn = db::get_db(&app)?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, created_at, updated_at, word_count, project_id, status, character_count
             FROM documents ORDER BY updated_at DESC",
        )
        .map_err(|e| format!("Query failed: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(DocumentMeta {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                word_count: row.get(4)?,
                project_id: row.get(5)?,
                status: row.get::<_, String>(6).unwrap_or_else(|_| "draft".to_string()),
                character_count: row.get(7)?,
            })
        })
        .map_err(|e| format!("Query map failed: {}", e))?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn delete_document(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_db(&app)?;

    conn.execute("DELETE FROM document_versions WHERE document_id = ?1", rusqlite::params![id]).ok();
    conn.execute("DELETE FROM document_tags WHERE document_id = ?1", rusqlite::params![id]).ok();
    conn.execute("DELETE FROM scheduled_posts WHERE document_id = ?1", rusqlite::params![id]).ok();
    conn.execute("DELETE FROM documents WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("Failed to delete document: {}", e))?;

    db::log_activity(&conn, "document.deleted", "document", Some(&id), None);

    Ok(())
}

#[tauri::command]
pub async fn auto_save(
    app: tauri::AppHandle,
    id: String,
    title: String,
    content: String,
    html_content: String,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();
    let wc = count_words(&html_content) as i64;

    let existing_created: Option<String> = conn
        .query_row(
            "SELECT created_at FROM documents WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .ok();
    let created_at = existing_created.unwrap_or_else(|| now.clone());

    conn.execute(
        "INSERT OR REPLACE INTO documents (id, title, content, html_content, project_id, status, word_count, character_count, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4,
                 COALESCE((SELECT project_id FROM documents WHERE id = ?1), NULL),
                 COALESCE((SELECT status FROM documents WHERE id = ?1), 'draft'),
                 ?5, 0,
                 COALESCE((SELECT version FROM documents WHERE id = ?1), 1),
                 ?6, ?7)",
        rusqlite::params![id, title, content, html_content, wc, created_at, now],
    )
    .map_err(|e| format!("Failed to auto-save: {}", e))?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Project commands
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub color: String,
    pub icon: String,
    pub sort_order: i64,
    pub document_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn create_project(
    app: tauri::AppHandle,
    name: String,
    color: Option<String>,
    icon: Option<String>,
) -> Result<Project, String> {
    let conn = db::get_db(&app)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let c = color.unwrap_or_else(|| "#7c3aed".to_string());
    let i = icon.unwrap_or_else(|| "folder".to_string());

    let sort: i64 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM projects", [], |row| row.get(0))
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO projects (id, name, description, color, icon, sort_order, created_at, updated_at)
         VALUES (?1, ?2, '', ?3, ?4, ?5, ?6, ?6)",
        rusqlite::params![id, name, c, i, sort, now],
    ).map_err(|e| format!("Failed to create project: {}", e))?;

    db::log_activity(&conn, "project.created", "project", Some(&id), Some(&name));

    Ok(Project {
        id, name, description: String::new(), color: c, icon: i,
        sort_order: sort, document_count: 0, created_at: now.clone(), updated_at: now,
    })
}

#[tauri::command]
pub async fn list_projects(app: tauri::AppHandle) -> Result<Vec<Project>, String> {
    let conn = db::get_db(&app)?;

    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.description, p.color, p.icon, p.sort_order, p.created_at, p.updated_at,
                (SELECT COUNT(*) FROM documents d WHERE d.project_id = p.id) as doc_count
         FROM projects p ORDER BY p.sort_order ASC"
    ).map_err(|e| format!("Query failed: {}", e))?;

    let rows = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            color: row.get(3)?,
            icon: row.get(4)?,
            sort_order: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            document_count: row.get(8)?,
        })
    }).map_err(|e| format!("Query map failed: {}", e))?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn update_project(
    app: tauri::AppHandle,
    id: String,
    name: Option<String>,
    color: Option<String>,
    icon: Option<String>,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();

    if let Some(n) = name {
        conn.execute("UPDATE projects SET name = ?1, updated_at = ?2 WHERE id = ?3", rusqlite::params![n, now, id]).ok();
    }
    if let Some(c) = color {
        conn.execute("UPDATE projects SET color = ?1, updated_at = ?2 WHERE id = ?3", rusqlite::params![c, now, id]).ok();
    }
    if let Some(i) = icon {
        conn.execute("UPDATE projects SET icon = ?1, updated_at = ?2 WHERE id = ?3", rusqlite::params![i, now, id]).ok();
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_project(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    conn.execute("UPDATE documents SET project_id = NULL WHERE project_id = ?1", rusqlite::params![id]).ok();
    conn.execute("DELETE FROM projects WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("Failed to delete project: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn move_document_to_project(
    app: tauri::AppHandle,
    document_id: String,
    project_id: Option<String>,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE documents SET project_id = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![project_id, now, document_id],
    ).map_err(|e| format!("Failed to move document: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn set_document_status(
    app: tauri::AppHandle,
    document_id: String,
    status: String,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE documents SET status = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![status, now, document_id],
    ).map_err(|e| format!("Failed to update status: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn add_document_tags(
    app: tauri::AppHandle,
    document_id: String,
    tags: Vec<String>,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    for tag in &tags {
        conn.execute(
            "INSERT OR IGNORE INTO document_tags (document_id, tag) VALUES (?1, ?2)",
            rusqlite::params![document_id, tag],
        ).ok();
    }
    Ok(())
}

#[tauri::command]
pub async fn remove_document_tag(
    app: tauri::AppHandle,
    document_id: String,
    tag: String,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    conn.execute(
        "DELETE FROM document_tags WHERE document_id = ?1 AND tag = ?2",
        rusqlite::params![document_id, tag],
    ).ok();
    Ok(())
}

// ---------------------------------------------------------------------------
// Document version commands
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentVersion {
    pub id: i64,
    pub document_id: String,
    pub title: String,
    pub version: i64,
    pub created_at: String,
    pub word_count: i64,
}

#[tauri::command]
pub async fn get_document_versions(
    app: tauri::AppHandle,
    document_id: String,
) -> Result<Vec<DocumentVersion>, String> {
    let conn = db::get_db(&app)?;
    let mut stmt = conn.prepare(
        "SELECT id, document_id, title, version, created_at, html_content FROM document_versions WHERE document_id = ?1 ORDER BY version DESC"
    ).map_err(|e| format!("Query failed: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![document_id], |row| {
        let html: String = row.get(5)?;
        Ok(DocumentVersion {
            id: row.get(0)?,
            document_id: row.get(1)?,
            title: row.get(2)?,
            version: row.get(3)?,
            created_at: row.get(4)?,
            word_count: count_words(&html) as i64,
        })
    }).map_err(|e| format!("Query map failed: {}", e))?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn restore_document_version(
    app: tauri::AppHandle,
    document_id: String,
    version: i64,
) -> Result<(), String> {
    let conn = db::get_db(&app)?;

    let (title, content, html_content): (String, String, String) = conn.query_row(
        "SELECT title, content, html_content FROM document_versions WHERE document_id = ?1 AND version = ?2",
        rusqlite::params![document_id, version],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    ).map_err(|_| "Version not found".to_string())?;

    let now = Utc::now().to_rfc3339();
    let wc = count_words(&html_content) as i64;
    let new_version: i64 = conn.query_row(
        "SELECT COALESCE(MAX(version), 0) + 1 FROM document_versions WHERE document_id = ?1",
        rusqlite::params![document_id], |row| row.get(0),
    ).unwrap_or(1);

    conn.execute(
        "UPDATE documents SET title = ?1, content = ?2, html_content = ?3, word_count = ?4, version = ?5, updated_at = ?6 WHERE id = ?7",
        rusqlite::params![title, content, html_content, wc, new_version, now, document_id],
    ).map_err(|e| format!("Failed to restore: {}", e))?;

    conn.execute(
        "INSERT INTO document_versions (document_id, title, content, html_content, version, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![document_id, title, content, html_content, new_version, now],
    ).ok();

    db::log_activity(&conn, "document.restored", "document", Some(&document_id), Some(&format!("Restored to version {}", version)));

    Ok(())
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityEntry {
    pub id: i64,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Option<String>,
    pub details: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub async fn get_recent_activity(
    app: tauri::AppHandle,
    limit: Option<i64>,
) -> Result<Vec<ActivityEntry>, String> {
    let conn = db::get_db(&app)?;
    let lim = limit.unwrap_or(50);

    let mut stmt = conn.prepare(
        "SELECT id, action, entity_type, entity_id, details, created_at FROM activity_log ORDER BY created_at DESC LIMIT ?1"
    ).map_err(|e| format!("Query failed: {}", e))?;

    let rows = stmt.query_map(rusqlite::params![lim], |row| {
        Ok(ActivityEntry {
            id: row.get(0)?,
            action: row.get(1)?,
            entity_type: row.get(2)?,
            entity_id: row.get(3)?,
            details: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|e| format!("Query map failed: {}", e))?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

// ---------------------------------------------------------------------------
// User template commands
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserTemplate {
    pub id: String,
    pub name: String,
    pub category: String,
    pub width: i64,
    pub height: i64,
    pub thumbnail: String,
    pub elements_json: String,
    pub usage_count: i64,
    pub is_builtin: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn save_user_template(
    app: tauri::AppHandle,
    name: String,
    category: String,
    width: i64,
    height: i64,
    elements_json: String,
    thumbnail: Option<String>,
) -> Result<String, String> {
    let conn = db::get_db(&app)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let thumb = thumbnail.unwrap_or_default();

    conn.execute(
        "INSERT INTO user_templates (id, name, category, width, height, thumbnail, elements_json, usage_count, is_builtin, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, 0, ?8, ?8)",
        rusqlite::params![id, name, category, width, height, thumb, elements_json, now],
    ).map_err(|e| format!("Failed to save template: {}", e))?;

    Ok(id)
}

#[tauri::command]
pub async fn list_user_templates(app: tauri::AppHandle) -> Result<Vec<UserTemplate>, String> {
    let conn = db::get_db(&app)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, category, width, height, thumbnail, elements_json, usage_count, is_builtin, created_at, updated_at
         FROM user_templates ORDER BY usage_count DESC, created_at DESC"
    ).map_err(|e| format!("Query failed: {}", e))?;

    let rows = stmt.query_map([], |row| {
        Ok(UserTemplate {
            id: row.get(0)?,
            name: row.get(1)?,
            category: row.get(2)?,
            width: row.get(3)?,
            height: row.get(4)?,
            thumbnail: row.get(5)?,
            elements_json: row.get(6)?,
            usage_count: row.get(7)?,
            is_builtin: row.get::<_, i64>(8)? == 1,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }).map_err(|e| format!("Query map failed: {}", e))?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub async fn delete_user_template(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    conn.execute("DELETE FROM user_templates WHERE id = ?1 AND is_builtin = 0", rusqlite::params![id])
        .map_err(|e| format!("Failed to delete template: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn increment_template_usage(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let conn = db::get_db(&app)?;
    conn.execute("UPDATE user_templates SET usage_count = usage_count + 1 WHERE id = ?1", rusqlite::params![id]).ok();
    Ok(())
}
