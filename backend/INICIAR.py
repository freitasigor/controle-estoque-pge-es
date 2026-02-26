import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from functools import wraps

app = Flask(__name__)
CORS(app)

# =====================================================================
# CONFIGURAÇÕES DE SEGURANÇA (Para fins de Portfólio)
# =====================================================================
TOKEN_SECRETO = "pge-admin-token-2024"
USUARIO_ADMIN = "admin"
SENHA_ADMIN = "pge@123"

def get_db():
    conn = sqlite3.connect("inventario.db")
    conn.row_factory = sqlite3.Row
    return conn

# =====================================================================
# MIDDLEWARE DE AUTENTICAÇÃO
# =====================================================================
def requer_autenticacao(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or token != f"Bearer {TOKEN_SECRETO}":
            return jsonify({"erro": "Acesso negado. Faça login."}), 401
        return f(*args, **kwargs)
    return decorated

# =====================================================================
# ROTAS PÚBLICAS (Qualquer um pode ver)
# =====================================================================

@app.route('/api/login', methods=['POST'])
def login():
    dados = request.json
    if dados.get('usuario') == USUARIO_ADMIN and dados.get('senha') == SENHA_ADMIN:
        return jsonify({"token": TOKEN_SECRETO, "nome": "Administrador PGE"})
    
    return jsonify({"erro": "Usuário ou senha incorretos."}), 401

@app.route('/api/estacoes')
def get_estacoes():
    conn = get_db()
    estacoes = conn.execute('SELECT * FROM estacoes').fetchall()
    res = []
    for est in estacoes:
        eqs = conn.execute('SELECT * FROM equipamentos WHERE estacao_id = ?', (est['id'],)).fetchall()
        res.append({
            "id": est['id'],
            "local": f"{est['andar']} - {est['setor']} (Sala {est['sala']})",
            "equipamentos": [dict(e) for e in eqs]
        })
    conn.close()
    return jsonify(res)

@app.route('/api/estoque')
def get_estoque():
    conn = get_db()
    eqs = conn.execute('SELECT * FROM equipamentos WHERE estacao_id IS NULL').fetchall()
    res = [dict(e) for e in eqs]
    conn.close()
    return jsonify(res)

@app.route('/api/historico')
def get_historico():
    conn = get_db()
    logs = conn.execute('SELECT * FROM historico ORDER BY id DESC LIMIT 50').fetchall()
    res = [dict(l) for l in logs]
    conn.close()
    return jsonify(res)

# =====================================================================
# ROTAS RESTRITAS (Só Admin pode alterar os dados)
# =====================================================================

@app.route('/api/equipamento', methods=['POST'])
@requer_autenticacao
def criar_equipamento():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO equipamentos (tipo, modelo, patrimonio) VALUES (?, ?, ?)', 
                 (data['tipo'], data['modelo'], data['patrimonio']))
    msg = f"Novo {data['tipo']} registrado no estoque: {data['patrimonio']}"
    conn.execute('INSERT INTO historico (data, acao) VALUES (?, ?)', (datetime.now().strftime("%d/%m/%Y %H:%M"), msg))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

@app.route('/api/equipamento/<int:eq_id>/vincular', methods=['POST'])
@requer_autenticacao
def vincular(eq_id):
    data = request.json
    conn = get_db()
    conn.execute('UPDATE equipamentos SET estacao_id = ? WHERE id = ?', (data['estacao_id'], eq_id))
    msg = f"Equipamento {eq_id} instalado na estação {data['estacao_id']}"
    conn.execute('INSERT INTO historico (data, acao) VALUES (?, ?)', (datetime.now().strftime("%d/%m/%Y %H:%M"), msg))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

@app.route('/api/equipamento/<int:eq_id>', methods=['PUT', 'DELETE'])
@requer_autenticacao
def gerir(eq_id):
    conn = get_db()
    if request.method == 'DELETE':
        conn.execute('UPDATE equipamentos SET estacao_id = NULL WHERE id = ?', (eq_id,))
    else:
        d = request.json
        conn.execute('UPDATE equipamentos SET modelo = ?, patrimonio = ? WHERE id = ?', (d['modelo'], d['patrimonio'], eq_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)