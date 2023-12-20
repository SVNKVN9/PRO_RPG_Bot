import Client from "./structure/Client";

const client = new Client()

client.start()

process.on('uncaughtException', (err) => {
    if (err.message.includes("Discord")) return
    
    console.error(err)

    client.log.ErrorHandling("🔴", err)
})