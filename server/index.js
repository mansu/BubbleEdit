import 'dotenv/config'
import { DEFAULT_MODEL, createAnthropicChat, createApp } from './app.js'

const PORT = process.env.PORT || 3001
const app = createApp({ chat: createAnthropicChat() })

app.listen(PORT, () => console.log(`BubbleEdit server on http://localhost:${PORT} [model: ${DEFAULT_MODEL}]`))
