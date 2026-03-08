const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json()); // Permite que a API receba dados no formato JSON

let isClientReady = false;

// =========================================================
// CONFIGURAÇÃO DO WHATSAPP
// =========================================================
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // REMOVA A LINHA executablePath: '/usr/bin/google-chrome-stable'
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--shm-size=1gb' // Ajuda na performance do Render
        ],
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code acima para conectar.');
});

client.on('ready', () => {
    console.log('Bot conectado e pronto para uso!');
    isClientReady = true;
});

client.on('disconnected', (reason) => {
    console.log('Bot desconectado:', reason);
    isClientReady = false;
});

// =========================================================
// ATENDIMENTO RECEPTIVO (Humanizado)
// =========================================================
client.on('message', async (msg) => {
    if (msg.isStatus || msg.fromMe || msg.from.includes('@g.us')) return;

    const chat = await msg.getChat();
    const textoMensagem = msg.body.toLowerCase();
    const tempoLeitura = Math.floor(Math.random() * 3000) + 1500; 

    setTimeout(async () => {
        await chat.sendStateTyping();
        const tempoDigitacao = Math.floor(Math.random() * 3000) + 2000;

        setTimeout(async () => {
            if (textoMensagem.includes('olá') || textoMensagem.includes('oi')) {
                await client.sendMessage(msg.from, 'Oi! Tudo bem? Como posso te ajudar hoje?');
            } else {
                await client.sendMessage(msg.from, 'Entendi. Vou registrar essa informação no sistema e já te dou um retorno, tá bom?');
            }
        }, tempoDigitacao);

    }, tempoLeitura);
});

// =========================================================
// ROTAS DA API (EXPRESS)
// =========================================================

// Rota POST para receber requisições do seu sistema em Python
app.post('/api/enviar', async (req, res) => {
    // Verifica se o WhatsApp já leu o QR Code e está pronto
    if (!isClientReady) {
        return res.status(503).json({ erro: 'O bot do WhatsApp ainda não está conectado.' });
    }

    // Recebe o número e a mensagem do corpo da requisição (JSON)
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ erro: 'Os campos "numero" e "mensagem" são obrigatórios.' });
    }

    // Formata o número (exemplo considerando números do Brasil: 55 + DDD + Numero)
    // O sufixo @c.us é obrigatório no whatsapp-web.js para contatos individuais
    const chatId = `${numero}@c.us`;

    try {
        const isRegistered = await client.isRegisteredUser(chatId);

        if (isRegistered) {
            await client.sendMessage(chatId, mensagem);
            return res.status(200).json({ sucesso: true, mensagem: `Mensagem enviada para ${numero}` });
        } else {
            return res.status(404).json({ erro: 'Número não possui WhatsApp ativo.', numero });
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem via API:', error);
        return res.status(500).json({ erro: 'Falha interna ao tentar enviar a mensagem.' });
    }
});

// =========================================================
// INICIALIZAÇÃO
// =========================================================
client.initialize();

const PORT = process.env.PORT || 3000; // Usa a porta do Render ou 3000 localmente
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);

});



