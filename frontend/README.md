# Sistema de Controle de Equipamentos de TI

Uma aplicação Full-Stack desenvolvida para modernizar a gestão de ativos de TI, permitindo o mapeamento de estações de trabalho, controle de estoque e auditoria de movimentações de hardwares (computadores, monitores, notebooks, etc).

## 🚀 Funcionalidades

- **Dashboard de Indicadores:** Visão geral rápida com total de ativos, itens pendentes de tombamento patrimonial e panorama do estoque atual.
- **Mapeamento de Estações (Mesas):** Visualização por andar, setor e sala. Permite identificar exatamente quais equipamentos estão instalados em cada estação de trabalho.
- **Gestão de Estoque:** Painel completo para adicionar novos hardwares, editar informações (Modelo/Condição/Patrimônio) e categorizar por tipos.
- **Vínculo Dinâmico:** Fluxo intuitivo para remover equipamentos de uma mesa (devolvendo-os ao estoque) ou instalar equipamentos do estoque diretamente em uma estação.
- **Auditoria Automática (Logs):** Registro histórico automático de toda ação realizada no sistema (ex: "Equipamento X instalado na estação Y").

## 🛠️ Stack Tecnológico

A aplicação foi dividida em dois serviços independentes para garantir escalabilidade e separação de responsabilidades (SoC).

**Frontend (Interface Gráfica):**
* React 19 + Vite (Rápido e otimizado para build)
* CSS3 Puro com Variáveis Globais (Identidade visual corporativa, inspirada em sistemas internos de gestão)
* Axios (Consumo da API REST)
* Lucide React (Ícones modernos)

**Backend (API & Dados):**
* Python 3
* Flask (Microframework leve e ágil para criação de endpoints RESTful)
* SQLite3 (Banco de dados relacional embutido e de fácil manutenção)
* Flask-CORS (Gerenciamento de permissões de origem cruzada)

## ⚙️ Como executar localmente

Como o sistema é Full-Stack, é necessário rodar o backend e o frontend simultaneamente. Você precisará de dois terminais abertos.

### 1. Iniciando o Backend (API)
Abra um terminal, acesse a pasta do servidor e inicie o Python:
\`\`\`bash
cd backend
python INICIAR.py
\`\`\`
*O servidor rodará em `http://127.0.0.1:5000/`*

### 2. Iniciando o Frontend (Aplicação React)
Abra um segundo terminal, acesse a pasta da interface e inicie o Vite:
\`\`\`bash
cd frontend
npm install   # Instala as dependências na primeira vez
npm run dev   # Inicia a aplicação
\`\`\`
*Acesse a interface no navegador através do link gerado no terminal (geralmente `http://localhost:5173/`)*