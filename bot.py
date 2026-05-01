import os
import subprocess
from datetime import datetime

# --- CONFIGURAÇÕES EXTRAÍDAS ---
GIT_TOKEN = "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"
GIT_USER  = "ogdudu013"
GIT_REPO  = "PoseidonBotWP"
PATH_BOT  = os.path.expanduser("~/poseidon-bot")

# URL com Token para não pedir senha no Termux
GIT_URL = f"https://{GIT_USER}:{GIT_TOKEN}@github.com/{GIT_USER}/{GIT_REPO}.git"

def run_command(command, cwd=None):
    try:
        # shell=True é necessário no Termux para comandos git
        subprocess.run(command, check=True, shell=True, cwd=cwd)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar: {command}")

def backup_poseidon():
    # 1. Verifica se a pasta do bot existe
    if not os.path.exists(PATH_BOT):
        print(f"❌ Erro: A pasta {PATH_BOT} não foi encontrada!")
        return

    print(f"🔄 Iniciando backup da pasta {PATH_BOT}...")

    # 2. Entra na pasta
    os.chdir(PATH_BOT)

    # 3. Inicializa o Git se necessário e configura o Remote
    if not os.path.exists(".git"):
        print("🔧 Inicializando repositório Git local...")
        run_command("git init")
        run_command(f"git remote add origin {GIT_URL}")
    else:
        # Atualiza a URL do remote caso o token mude
        run_command(f"git remote set-url origin {GIT_URL}")

    # 4. Configura identidade local para o commit
    run_command("git config user.name 'ogdudu013'")
    run_command("git config user.email 'bot@poseidon.com'")

    # 5. Adiciona arquivos, commit e push
    print("📤 Preparando arquivos...")
    run_command("git add .")
    
    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    commit_msg = f"Backup Automático Poseidon: {timestamp}"
    
    try:
        run_command(f'git commit -m "{commit_msg}"')
    except:
        print("✨ Nenhuma alteração detectada para subir.")
        return

    print("🚀 Enviando para o GitHub...")
    run_command("git branch -M main")
    run_command("git push -u origin main")

    print("✅ Backup concluído com sucesso!")

if __name__ == "__main__":
    backup_poseidon()
