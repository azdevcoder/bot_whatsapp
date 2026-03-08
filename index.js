const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let isClientReady = false;

// Configuração do Cliente com estratégia de persistência local
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "azdev-session"
    }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome', // Caminho padrão no Docker do Puppeteer
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ],
    }
});
// Eventos do WhatsApp
client.on('qr', (qr) => {
    console.log('--- NOVO QR CODE GERADO ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot AzDev conectado e pronto para uso!');
    isClientReady = true;
});

client.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

// =========================================================
// ATENDIMENTO RECEPTIVO (Humanizado)
// =========================================================
client.on('message', async (msg) => {
    if (msg.isStatus || msg.fromMe || msg.from.includes('@g.us')) return;

    const chat = await msg.getChat();
    const textoMensagem = msg.body.toLowerCase();

    // Simulação de tempo de leitura
    const delayLeitura = Math.floor(Math.random() * 2000) + 1000;

    setTimeout(async () => {
        await chat.sendStateTyping();
        
        // Simulação de tempo de digitação (baseado no tamanho da resposta)
        const delayDigitacao = Math.floor(Math.random() * 3000) + 2000;

        setTimeout(async () => {
            if (textoMensagem.includes('oi') || textoMensagem.includes('olá') || textoMensagem.includes('bom dia')) {
                await client.sendMessage(msg.from, 'Olá! Como posso ajudar você hoje?');
            } else if (textoMensagem.includes('pedido') || textoMensagem.includes('pagamento')) {
                await client.sendMessage(msg.from, 'Vou verificar essa informação no sistema agora mesmo. Um momento, por favor.');
            } else {
                await client.sendMessage(msg.from, 'Entendi. Vou encaminhar sua mensagem para nossa equipe e logo te damos um retorno.');
            }
        }, delayDigitacao);

    }, delayLeitura);
});

// =========================================================
// API PARA DISPAROS ATIVOS (Lembretes/Cobranças do Python)
// =========================================================
app.post('/api/enviar', async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!isClientReady) {
        return res.status(503).json({ erro: 'O bot ainda não está pronto para enviar mensagens.' });
    }

    if (!numero || !mensagem) {
        return res.status(400).json({ erro: 'Parâmetros "numero" e "mensagem" são obrigatórios.' });
    }

    try {
        // Formata o número (DDI + DDD + Número)
        const cleanNumber = numero.replace(/\D/g, '');
        const chatId = `${cleanNumber}@c.us`;

        const isRegistered = await client.isRegisteredUser(chatId);

        if (isRegistered) {
            await client.sendMessage(chatId, mensagem);
            console.log(`[Ativo] Mensagem enviada para: ${numero}`);
            return res.status(200).json({ sucesso: true, status: 'Enviado' });
        } else {
            return res.status(404).json({ erro: 'Número não registrado no WhatsApp.' });
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem ativa:', error);
        return res.status(500).json({ erro: 'Erro interno ao processar envio.' });
    }
});

// Rota padrão para teste de saúde
app.get('/', (req, res) => {
    res.status(200).send(isClientReady ? 'Bot Online' : 'Bot Offline - Aguardando Autenticação');
});

// Inicialização do Servidor e do Bot
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor API rodando na porta ${PORT}`);
    client.initialize().catch(err => {
        console.error('Falha crítica ao inicializar cliente WhatsApp:', err);
    });
});


