/*
   🌊 POSEIDON MUSIC TECH BOT 🌊
   ⚡ Versão 2.4.0 - Design Maravilhoso
   👑 Desenvolvido por Poseidon Music Tech
*/

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const chokidar = require('chokidar');

let prefix = '!';
let jaPareou = false;

// ===================== ANTI-BAN =====================
const messageQueue = [];
let isProcessingQueue = false;
const MIN_DELAY = 1400;
const MAX_DELAY = 4200;

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise(resolve => rl.question(text, resolve));

/* Envio com delay humanizado reforçado */
async function enviar(from, texto, quoted = null) {
    return new Promise((resolve) => {
        messageQueue.push({ from, texto, quoted, resolve });
        processQueue();
    });
}

async function processQueue() {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    const { from, texto, quoted, resolve } = messageQueue.shift();

    try {
        // Simulação de digitação mais realista
        await client.sendPresenceUpdate('composing', from);
        await esperar(1200 + Math.random() * 1800); // 1.2s a 3s digitando

        await client.sendMessage(from, { text: texto }, { quoted });

        // Delay entre mensagens (anti-span)
        const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
        await esperar(delay);
    } catch (e) {
        console.error('Erro ao enviar:', e);
    }

    isProcessingQueue = false;
    if (messageQueue.length > 0) processQueue();
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BANNER DO BOT (Imagem via URL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
async function enviarBanner(from, quoted) {
    const bannerUrl = "https://i.imgur.com/0Z8Z8Z8.jpg"; // ← Troque por sua imagem

    await client.sendMessage(from, {
        image: { url: bannerUrl },
        caption: `
╔══════════════════════════════╗
       🌊 POSEIDON MUSIC TECH 🌊
╚══════════════════════════════╝

⚡ *Bot Premium de Alta Qualidade*
👑 Criado por Poseidon Music Tech
        `,
        footer: 'v2.4.0 • Design Exclusivo',
    }, { quoted });
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MENU PRINCIPAL - DESIGN MARAVILHOSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
async function enviarMenu(from, quoted) {
    const menu = `
╔════════════════════════════════════════════╗
          🌊 POSEIDON MUSIC TECH 🌊
╚════════════════════════════════════════════╝

✨ *MENU PRINCIPAL* ✨

📌 *Informações*
➤ ${prefix}menu
➤ ${prefix}ping
➤ ${prefix}info
➤ ${prefix}banner

👑 *Sobre o Dono*
➤ ${prefix}dono

⚙️ *Utilidades*
➤ ${prefix}setprefix [símbolo]
➤ ${prefix}status

🎵 *Música & Tech*
➤ ${prefix}ajuda

════════════════════════════════════════════
Prefixo atual: *${prefix}*
Versão: 2.4.0 • Anti-Ban Ativo
Criado por Poseidon Music Tech
════════════════════════════════════════════
    `.trim();

    await enviar(from, menu, quoted);
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BOT PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

async function ligarbot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessao');
    const { version } = await fetchLatestBaileysVersion();

    global.client = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        printQRInTerminal: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 2000,
        markOnlineOnConnect: true,
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !jaPareou) {
            jaPareou = true;
            console.log('\n📱 Aguardando pareamento...\n');
            const numero = await question('Digite seu número com DDD (ex: 5511999999999):\n');
            const cleanNumber = numero.replace(/[^0-9]/g, '');
            let code = await client.requestPairingCode(cleanNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n🔑 Código de pareamento: ${code}\n`);
        }

        if (connection === 'open') {
            console.log('\n✅ 🌊 POSEIDON MUSIC TECH CONECTADO COM SUCESSO! 🌊\n');
        }

        if (connection === 'close') {
            const status = lastDisconnect?.error?.output?.statusCode;
            if (status !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconectando em 5 segundos...');
                await esperar(5000);
                ligarbot();
            }
        }
    });

    /* Mensagens */
    client.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const info = messages[0];
            if (!info.message || info.key.fromMe) return;

            const from = info.key.remoteJid;
            if (from === 'status@broadcast') return;

            await client.readMessages([info.key]);

            let body = '';
            const type = Object.keys(info.message)[0];

            if (type === 'conversation') body = info.message.conversation;
            else if (type === 'extendedTextMessage') body = info.message.extendedTextMessage.text;
            else if (type === 'imageMessage') body = info.message.imageMessage.caption || '';
            else if (type === 'videoMessage') body = info.message.videoMessage.caption || '';

            if (!body) return;

            const isCmd = body.startsWith(prefix);
            const comando = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : null;
            const args = body.slice(prefix.length).trim().split(/ +/).slice(1).join(' ');

            switch (comando) {

                case 'menu':
                    await enviarMenu(from, info);
                    break;

                case 'banner':
                    await enviarBanner(from, info);
                    break;

                case 'ping':
                    await enviar(from, `🏓 *Pong!*\n\n🔥 Resposta rápida e estável!`, info);
                    break;

                case 'info':
                    await enviar(from, `
╔══════════════════════════════╗
       🤖 INFO DO BOT
╚══════════════════════════════╝

🌊 Nome: Poseidon Music Tech
⚡ Versão: 2.4.0 Premium
🛡️ Anti-Ban: Ativo
🔄 Auto Restart: Ativo
📦 Biblioteca: Baileys
🧠 Linguagem: Node.js

"Música, Tecnologia e Poder no WhatsApp 🌊⚡"
                    `.trim(), info);
                    break;

                case 'dono':
                    await enviar(from, `
👑 *DONO DO BOT*

Nome: Poseidon Music Tech
Função: Desenvolvedor Full-Stack
Especialidade: Música + Tecnologia + Automação

"O mar obedece ao meu comando." 🌊
                    `.trim(), info);
                    break;

                case 'status':
                    await enviar(from, `✅ Bot online e funcionando perfeitamente!\nAnti-Ban: Ativo\nPrefixo: ${prefix}`, info);
                    break;

                case 'ajuda':
                    await enviar(from, `🎵 *Ajuda Poseidon*\n\nUse ${prefix}menu para ver todas as opções disponíveis.`, info);
                    break;

                case 'setprefix':
                    if (!args) return await enviar(from, `❌ Uso: ${prefix}setprefix [novo]\nExemplo: ${prefix}setprefix .`, info);
                    prefix = args[0];
                    await enviar(from, `✅ Prefixo alterado com sucesso!\nNovo prefixo: *${prefix}*`, info);
                    break;

                default:
                    if (isCmd) {
                        await enviar(from, `❓ Comando *\( {prefix} \){comando}* não encontrado.\nDigite *${prefix}menu* para ver todas as opções.`, info);
                    }
            }

        } catch (err) {
            console.error('Erro no handler:', err);
        }
    });

    return client;
}

/* Auto Restart ao salvar arquivos */
function iniciarMonitoramento() {
    console.log('👀 Monitorando arquivos... (Auto Restart ativado)');
    chokidar.watch('.', {
        ignored: /(^|[\/\\])\.|node_modules|sessao/,
        persistent: true,
        ignoreInitial: true
    }).on('change', (path) => {
        console.log(`🔄 Arquivo alterado: ${path}`);
        console.log('♻️ Reiniciando bot...');
        setTimeout(() => process.exit(0), 1800);
    });
}

/* Iniciar o Bot */
(async () => {
    console.log(`
   🌊═══════════════════════════════════════🌊
         POSEIDON MUSIC TECH BOT 2.4.0
               DESIGN MARAVILHOSO ATIVADO
   🌊═══════════════════════════════════════🌊
    `);

    await ligarbot();
    iniciarMonitoramento();
})();
