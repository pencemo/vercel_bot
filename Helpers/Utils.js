export const HELP_TEXT = `
How can I assist you today?

\\/start \\- Start the bot
\\/help \\- Get help
\\/about \\- About me
\\/id \\- Get your Telegram ID
\\/ping \\- Check if the bot is online
\\/toadmin \\- Send message to admin
\\/qrcode \\- Generate a QR code
`

export const ABOUT_TEXT = `📄 *About me*

Creator : *[α̅η̲ɗɾo͚ȋɗ കുഞ്ഞപ്പൻ](http:\\/\\/t\\.me/mnmsby)* 
Updates : *[Pencemo Designs](https:\\/\\/t\\.me/pencemodesigns)*
Language : *JavaScript*
DataBase : *[MongoDB](https:\\/\\/www\\.mongodb\\.com)*
Build Status : *v2\\.1\\.0 [stable]*`

export const ADMIN_TEXT = `
Admin commands
\\/ban \\- Ban a user
\\/unban \\- Unban a user
\\/batch \\- Create batch link
\\/done \\- Batch done
\\/filters \\- All filters
\\/del \\- Delete a filters
\\/add \\- Add a filters
\\/rmv \\- Remove a filters
\\/broadcast \\- Replay to msg

\\/dellink \\- Delete a link
\\/delbatch \\- Delete a batch
\\/delallbatch \\- Delete all batchs
\\/delallfile \\- Delete all files
\\/delfiter \\- Delete all filters 
`
export const ADMIN_ONLY_TEXT = `Your not my admin 😏`


export const helpMarkup = (isAdmin = false)=>{
    return {
        inline_keyboard: [
            [
                ...(isAdmin ? [{ text: 'Admin ⚙️', callback_data: 'admin' }]: []),
                { text: 'About 📝', callback_data: 'about' }
            ],
            [
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
