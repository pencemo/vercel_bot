// const escapeMarkdownSpecialChars = (text) => {
//     // Regular expression that matches all characters with special meaning in MarkdownV2
//     const markdownSpecialChars = /([\\_*[\]()~`>#+\-.!|])/g;
  
//     // Replace each special character with its escaped version
//     return text.replace(markdownSpecialChars, '\\$1');
//   };
import { markdownv2 as format } from "telegram-format";
const escapeMarkdownSpecialChars = (text) => {
  // Escape special characters that can interfere with markdown formatting
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '.', '!', '|'];
  let escapedText = text;

  specialChars.forEach((char) => {
    const regex = new RegExp(`\\${char}`, 'g');
    escapedText = escapedText.replace(regex, `\\${char}`);
  });
 
  return escapedText;
};

const addMarkdownFormatting = (text, entities) => {
    if(!entities) return text
    // Sort entities by offset in descending order to avoid issues with overlapping ranges
    entities.sort((a, b) => b.offset - a.offset);
  
    let formattedText = escapeMarkdownSpecialChars(text);
  
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
        case 'mention':
            formattedText = `${formattedText.slice(0, entity.offset)}[${formattedText.slice(entity.offset, entity.offset + entity.length)}](tg://user?id=${entity.user.id})${formattedText.slice(entity.offset + entity.length)}`;
            break;
        case 'cashtag':
            formattedText = `${formattedText.slice(0, entity.offset)}$${formattedText.slice(entity.offset, entity.offset + entity.length)}${formattedText.slice(entity.offset + entity.length)}`;
            break;
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
    // Strip the initial part like '/add' if needed
    let input = inputString.replace(/^\/msg\s*/, "");

    // Extract filters
    const filterRegex = /"(.*?)"/g; // Matches content inside double quotes
  const buttonRegex = /\[(.*?)\]\((.*?)\)/g; // Matches [button](url) pattern

  // Extract filters
  const filters = [];
  let match;
  while ((match = filterRegex.exec(input)) !== null) {
    filters.push(match[1]);
  }
  
  // Extract buttons into arrays based on '|' separator
  const buttons = [];
  const buttonGroups = input.split('|'); // Split input into groups based on '|'

  buttonGroups.forEach(group => {
    const groupButtons = [];
    while ((match = buttonRegex.exec(group)) !== null) {
      groupButtons.push({ text: match[1], url: match[2] });
    }
    if (groupButtons.length > 0) {
      buttons.push(groupButtons);
    }
  });

  return {
    name: filters,
    buttons: buttons,
  };
}


  export {addMarkdownFormatting, extractData}