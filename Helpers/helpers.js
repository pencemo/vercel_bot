
export const escapeMarkdownSpecialChars = (text) => {
  if(!text) return
  // Escape special characters that can interfere with markdown formatting
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '.', '!', '|'];
  let escapedText = text;

  specialChars.forEach((char) => {
    const regex = new RegExp(`\\${char}`, 'g');
    escapedText = escapedText.replace(regex, `\\${char}`);
  });
 
  return escapedText;
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// utils/markdown.js
export function escapeMarkdownV2(text = "") {
  if (typeof text !== "string") text = String(text);

  // 1️⃣ Escape backslashes first
  text = text.replace(/\\/g, "\\\\");

  // 2️⃣ Escape all special MarkdownV2 characters
  //    `_ * [ ] ( ) ~ ` > # + - = | { } . !`
  //    Hyphen '-' and dot '.' are placed at the END of the character class
  return text.replace(/([_*\[\]()~`>#+=|{}!\.-])/g, "\\$1");
}




const addMarkdownFormatting = (text, entities) => {
    if(!entities) return text
    // Sort entities by offset in descending order to avoid issues with overlapping ranges
    entities.sort((a, b) => b.offset - a.offset);
  
    let formattedText = escapeMarkdownV2(text);
  
    // Apply formatting based on entities
    entities.forEach(entity => {
      switch (entity.type) { 
        case 'bold':
          formattedText = `${formattedText.slice(0, entity.offset)}*${formattedText.slice(entity.offset, entity.offset + entity.length)}*${formattedText.slice(entity.offset + entity.length)}`;
          break; 
        case 'italic':
          formattedText = `${formattedText.slice(0, entity.offset)}_${formattedText.slice(entity.offset, entity.offset + entity.length)}_${formattedText.slice(entity.offset + entity.length)}`;
          break;
        case 'underline':
          formattedText = `${formattedText.slice(0, entity.offset)}__${formattedText.slice(entity.offset, entity.offset + entity.length)}__${formattedText.slice(entity.offset + entity.length)}`;
          break; 
        case 'strikethrough':
          formattedText = `${formattedText.slice(0, entity.offset)}~${formattedText.slice(entity.offset, entity.offset + entity.length)}~${formattedText.slice(entity.offset + entity.length)}`;
          break;
        case 'code':
            formattedText = `${formattedText.slice(0, entity.offset)}\`${formattedText.slice(entity.offset, entity.offset + entity.length)}\`${formattedText.slice(entity.offset + entity.length)}`;
            break;
        case 'pre':
          formattedText = `${formattedText.slice(0, entity.offset)}\`\`\`${formattedText.slice(entity.offset, entity.offset + entity.length)}\`\`\`${formattedText.slice(entity.offset + entity.length)}`;
          break;
        case 'text_link':
          formattedText = `${formattedText.slice(0, entity.offset)}[${formattedText.slice(entity.offset, entity.offset + entity.length)}](${entity.url})${formattedText.slice(entity.offset + entity.length)}`;
          break;
        // case 'mention':
        //     formattedText = `${formattedText.slice(0, entity.offset)}[${formattedText.slice(entity.offset, entity.offset + entity.length)}](tg://user?id=${entity.user.id})${formattedText.slice(entity.offset + entity.length)}`;
        //     break;
        // case 'cashtag':
        //     formattedText = `${formattedText.slice(0, entity.offset)}$${formattedText.slice(entity.offset, entity.offset + entity.length)}${formattedText.slice(entity.offset + entity.length)}`;
        //     break;
        case 'quote':
            formattedText = `${formattedText.slice(0, entity.offset)}>${formattedText.slice(entity.offset, entity.offset + entity.length)}>${formattedText.slice(entity.offset + entity.length)}`;
            break;
        case 'link': 
            formattedText = `${formattedText.slice(0, entity.offset)}[${formattedText.slice(entity.offset, entity.offset + entity.length)}](${entity.url})${formattedText.slice(entity.offset + entity.length)}`;
            break;
        case 'blockquote':
            formattedText = `${formattedText.slice(0, entity.offset)}>${formattedText.slice(entity.offset, entity.offset + entity.length)}${formattedText.slice(entity.offset + entity.length)}`;
            break;
        case 'code_block':
            formattedText = `${formattedText.slice(0, entity.offset)}\`\`\`${formattedText.slice(entity.offset, entity.offset + entity.length)}\`\`\`${formattedText.slice(entity.offset + entity.length)}`;
            break;
        case 'spoiler':
            formattedText = `${formattedText.slice(0, entity.offset)}||${formattedText.slice(entity.offset, entity.offset + entity.length)}||${formattedText.slice(entity.offset + entity.length)}`;
            break;
      }
    });
  
    // Escape markdown special characters after applying the formatting
    // formattedText = escapeMarkdownSpecialChars(formattedText);
  
    return formattedText;
  };


  function extractData(inputString) {
    // Remove command like /msg or /add from the start
    let input = inputString.replace(/^\/(?:msg|add|del|rmv)\s*/, "").trim();
  
    // --- Extract buttons first ---
    const buttonRegex = /\[(.*?)\]\((.*?)\)/g;
    const buttons = [];
    const buttonGroups = input.split("|");
    let match;
  
    buttonGroups.forEach((group) => {
      const groupButtons = [];
      while ((match = buttonRegex.exec(group)) !== null) {
        groupButtons.push({ text: match[1].trim(), url: match[2].trim() });
      }
      if (groupButtons.length > 0) {
        buttons.push(groupButtons);
      }
    });
  
    // --- Remove all [text](url) patterns so they don't appear in filters ---
    const inputWithoutButtons = input.replace(buttonRegex, "").trim();
  
    // --- Extract filters (quoted or unquoted) ---
    const filterRegex = /"([^"]+)"|([^\s\[\]\(\)\|]+)/g;
    const filters = [];
    const urlPattern = /^(https?:\/\/|www\.)/i;
  
    while ((match = filterRegex.exec(inputWithoutButtons)) !== null) {
      const value = (match[1] || match[2] || "").trim();
  
      // Skip empty, URL-like, or invalid text
      if (
        !value ||
        value.startsWith("[") ||
        value.startsWith("(") ||
        value.includes("]") ||
        value.includes(")") ||
        value.includes("|") ||
        urlPattern.test(value)
      ) {
        continue;
      }
  
      filters.push(value);
    }
  
    // Remove duplicates
    const uniqueFilters = [...new Set(filters)];
  
    return {
      name: uniqueFilters,
      buttons,
    };
  }
  


  export {addMarkdownFormatting, extractData, escapeRegex}