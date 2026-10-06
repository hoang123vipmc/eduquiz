import React from "react";
import { cn } from "@/lib/utils";

interface FormattedTextProps {
  text?: string | null;
  className?: string;
}

/**
 * Normalizes all variations of line breaks:
 * - <br>, <br/>, <br />, <br   />
 * - &lt;br&gt;, &lt;br/&gt;, &lt;br /&gt;
 * - literal "\n", \r\n, \r
 * Also safely unescapes standard HTML entities for programming code symbols (<, >, &, ", ')
 */
export function normalizeLineBreaks(text?: string | null): string {
  if (!text) return "";
  let res = String(text).normalize("NFC");

  // 1. Replace <br> and &lt;br&gt; variations with newline
  res = res
    .replace(/&lt;br\s*\/?&gt;/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // 2. Decode common HTML entities safely for programming codes
  res = res
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // 3. Fix stray typewriter backticks or accents glued inside Vietnamese words (e.g. cấ`p -> cấp, điề`u -> điều, Phầ`n -> Phần, mề`m -> mềm)
  res = res
    .replace(/([a-zA-ZăâđêôơưĂÂĐÊÔƠƯáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ])[`'‘´]([a-zA-ZăâđêôơưĂÂĐÊÔƠƯáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ])/gu, "$1$2")
    .replace(/([a-zA-ZăâđêôơưĂÂĐÊÔƠƯáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ])[`'‘´]/gu, "$1");

  return res;
}

/**
 * Converts text with <br /> and newlines into a clean single-line string
 * suitable for table cells, truncated previews, and HTML title attributes.
 */
export function cleanInlineText(text?: string | null): string {
  if (!text) return "";
  return normalizeLineBreaks(text)
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips leading option prefixes such as "A. ", "*B. ", "1) ", "A) ", "(A) ", etc.
 * Safely preserves decimal and version numbers like "3.0", "1.0", "3.14", etc.
 */
export function cleanOptionPrefix(text?: string | null): string {
  if (!text) return "";
  const str = String(text).trim();

  // Strip leading prefixes while protecting decimal/version numbers (e.g. 3.0, 1.0)
  const cleaned = str
    // Remove leading bullet/asterisk/dash if present before prefix (e.g. "* A. ", "- B. ")
    .replace(/^[\*\•\-\–]\s*/, "")
    // Parenthesized label like (A) or (1)
    .replace(/^\([A-Za-z0-9]\)\s*/, "")
    // Letter prefix with delimiter and trailing whitespace (e.g. "A. ", "B) ", "C: ", "D - ")
    .replace(/^[A-Za-z]\s*[\.\:\)\-]\s+/, "")
    // Letter prefix without space only if followed by non-digits/non-punctuation (e.g. "A.Hà Nội")
    .replace(/^[A-Za-z]\s*[\.\:\)\-](?=[^\d\.\:\)\-\s])/, "")
    // Number prefix with dot: '1. ' (MUST be followed by whitespace, protecting decimals like 3.0, 1.5)
    .replace(/^\d+\.\s+/, "")
    // Number prefix with closing parenthesis, colon or dash: '1) ', '1: ', '1- '
    .replace(/^\d+\s*[\:\)\-]\s*/, "")
    .trim();

  // If cleaning resulted in an empty string (e.g. text was literally "A." or "1"), return original trimmed string
  return cleaned || str;
}

/**
 * Safely renders text preserving visual line breaks from
 * <br />, <br>, &lt;br /&gt;, and \n without dangerouslySetInnerHTML.
 */
export function FormattedText({ text, className = "" }: FormattedTextProps) {
  if (!text) return null;

  const normalized = normalizeLineBreaks(text);
  const lines = normalized.split("\n");

  return (
    <span className={cn("whitespace-pre-wrap leading-relaxed inline-block max-w-full", className)}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
}

export default FormattedText;
