const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let isClientReady = false;

// Configuração do Cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // No Render, o buildpack ou o comando de build instalam o chrome aqui:
        executablePath: '/usr/bin/google-chrome-stable', 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote'
        ],
    }
});

// Exibe o QR Code nos Logs do Render
client.on('qr', (qr) => {
    console.log('--- ESCANEIE O QR CODE ABAIXO ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('AzDev Bot: Conectado com sucesso ao WhatsApp!');
    isClientReady = true;
});

// =========================================================
// ATENDIMENTO RECEPTIVO (Humanizado)
// =========================================================
client.on('message', async (msg) => {
    // Ignora status, grupos e mensagens próprias
    if (msg.isStatus || msg.fromMe || msg.from.includes('@g.us')) return;

    const chat = await msg.getChat();
    const texto = msg.body.toLowerCase();

    // Simula tempo de "leitura" (entre 1.5s e 4s)
    const tempoLeitura = Math.floor(Math.random() * 2500) + 1500;

    setTimeout(async () => {
        // Ativa o status "digitando..."
        await chat.sendStateTyping();
        
        // Simula tempo de "digitação" (entre 2s e 5s)
        const tempoDigitacao = Math.floor(Math.random() * 3000) + 2000;

        setTimeout(async () => {
            if (texto.includes('olá') || texto.includes('oi') || texto.includes('bom dia')) {
                await client.sendMessage(msg.from, 'Oi! Tudo bem? Como posso te ajudar hoje?');
            } else if (texto.includes('pedido') || texto.includes('entrega')) {
                await client.sendMessage(msg.from, 'Vou verificar o status aqui no sistema. Só um instantinho...');
            } else {
                await client.sendMessage(msg.from, 'Entendi. Vou avisar o pessoal e já te damos um retorno, tá bom?');
            }
        }, tempoDigitacao);

    }, tempoLeitura);
});

// =========================================================
// ROTA PARA DISPAROS ATIVOS (Usada pelo Python)
// =========================================================
app.post('/api/enviar', async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!isClientReady) {
        return res.status(503).json({ erro: 'O bot ainda não está conectado ao WhatsApp.' });
    }

    if (!numero || !mensagem) {
        return res.status(400).json({ erro: 'Informe "numero" (com DDI e DDD) e "mensagem".' });
    }

    try {
        // Formata para o ID do WhatsApp (ex: 5544999999999@c.us)
        const chatId = `${numero.replace(/\D/g, '')}@c.us`;
        
        const isRegistered = await client.isRegisteredUser(chatId);

        if (isRegistered) {
            await client.sendMessage(chatId, mensagem);
            return res.status(200).json({ sucesso: true, msg: `Enviado para ${numero}` });
        } else {
            return res.status(404).json({ erro: 'Este número não possui WhatsApp.' });
        }
    } catch (error) {
        console.error('Erro no disparo ativo:', error);
        return res.status(500).json({ erro: 'Falha ao enviar mensagem.' });
    }
});

// Rota de Health Check (para você testar se a API está online)
app.get('/', (req, res) => {
    res.send('API AzDev Bot rodando! Status do WhatsApp: ' + (isClientReady ? 'Conectado' : 'Aguardando login'));
});

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    client.initialize();
});
