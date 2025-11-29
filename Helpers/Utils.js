export const HELP_TEXT = `
How can I assist you today?

\\/start \\- Start the bot
\\/help \\- Get help
\\/settings \\- Change mode
\\/about \\- About me
\\/id \\- Get your Telegram ID
\\/ping \\- Check if the bot is online
\\/toadmin \\- Send message to admin

\\/qrcode \\- Generate a QR code
\\/logo \\- Get brand logo
\\/icon \\- Get icons
`

export const ABOUT_TEXT = `📄 *About me*

Creator : *[α̅η̲ɗɾo͚ȋɗ കുഞ്ഞപ്പൻ](http:\\/\\/t\\.me/mnmsby)* 
Updates : *[Pencemo Designs](https:\\/\\/t\\.me/pencemodesigns)*
Language : *JavaScript*
DataBase : *[MongoDB](https:\\/\\/www\\.mongodb\\.com)*
Build Status : *v2\\.1\\.0 [stable]*`

export const ADMIN_TEXT = `
*Admin commands* 🕵️‍♂️

*Functions*
\\/add \\- Add a filters
\\/del \\- Delete a filters
\\/rmv \\- Remove a filters
\\/filters \\- All filters
\\/link \\- Create link
\\/batch \\- Create batch link
\\/done \\- Batch done
\\/addtobatch \\- Add file to batch 
\\/channel \\- Post to sub channel 

*User Management*
\\/ban \\- Ban a user
\\/unban \\- Unban a user
\\/touser \\- Msg to user
\\/broadcast \\- Replay to msg
\\/userlist \\- All users list

*Other*
\\/dellink \\- Delete a link
\\/delbatch \\- Delete a batch
\\/delallbatch \\- Delete all batchs
\\/delallfile \\- Delete all files
\\/delfiter \\- Delete all filters 
`

export const LOGO_TEXT = `You can now get brand logo files directly through the bot — instantly and in multiple styles\\! \n\nSupported formats & styles:
\`\`\`
✔️ SVG & PNG
✔️ Color, Black, White
✔️ Glyph & Wordmark versions \`\`\`

Just use the command:
/logo \\<brand name\\>
`

export const QR_TEXT = `Generate your on QR Code with bot\\! 

*How to use:*
\`• Reply to a message wiht /qrcode
• Or: /qrcode Your text here \`

Then choose the format \\(PNG/SVG\\)\\.
`

export const ICON_TEXT = `Now can get icon files directly through the bot\\! 

*How to use:*
\_• Reply to a message wiht /icon
• Or: /icon icon\\-name 
• choose the format \\(PNG/SVG\\)\\. \_ 

💡Here are some icon name examples:
 \`\\/icon home\`
 \`\\/icon home\\-outline\`
 \`\\/icon home\\-outline-rounded\`
 \`\\/icon home\\-outline-sharp\`
 \`\\/icon home\\-rounded\`
 \`\\/icon home\\-sharp\`
 \`\\/icon home\\-bold\`
 \`\\/icon home\\-duotone\`
 \`\\/icon home\\-broken\`
 \`\\/icon home\\-line-duotone\`
 \`\\/icon home\\-fill\`
 \`\\/icon home\\-line\`
 \`\\/icon home\\-solid\`
`
export const ADMIN_ONLY_TEXT = `Your not my admin 😏`
export const SETTINGS_TEXT = `⚙️ Settings\n\nChoose your mode:\n\n*Filter :* Get filter in pm\n*Converter :* Unicode to ASSCI`


export const helpMarkup = (isAdmin = false)=>{
    return {
        inline_keyboard: [
            (isAdmin ? [{ text: 'Admin 🥷', callback_data: 'admin' }]: []),
            [
                { text: 'Settings ⚙️', callback_data: 'settings' },
                { text: 'QR Code 🔗', callback_data: 'qrcode' }
            ],
            [
                { text: 'Logo 📝', callback_data: 'logo' },
                { text: 'Icon ⚜️', callback_data: 'icon' },
            ],
            [
                { text: 'About 🔥', callback_data: 'about' },
                { text: 'Support Group 👩‍💻', url: 'https://t.me/pencemodesign' }
            ],
        ]
    }
}

export const aboutMarkup = {
    inline_keyboard: [
        [
            { text: 'Help ⚙️', callback_data: 'help' },
        ],
        [
            { text: 'Creator 👩‍💻', url: 'https://t.me/mnmsby' }
        ]
    ]
}

export const adminMarkup = {
    inline_keyboard: [
        [
            { text: 'Users 🕵️‍♂️', callback_data: 'users' },
            { text: 'Filter ✨', callback_data: 'filters' },
        ],
        [
            { text: 'File 📂', callback_data: 'files' },
            { text: 'Batch 🗃️', callback_data: 'batch' },
        ],
        [
            { text: 'Back 🔙', callback_data: 'help' },
        ]
    ]
}
