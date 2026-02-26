import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Search, HardDrive, X, Trash2, 
  Package, Edit, Clock, Activity, AlertCircle, Lock, LogOut, LogIn
} from 'lucide-react';
import './index.css';

// =====================================================================
// CONFIGURAÇÃO DO AXIOS (Interceptor de Requisições)
// =====================================================================
// Toda vez que o React for mandar algo pro Backend, ele passa por aqui.
// Se ele achar o Token de Admin salvo no navegador, ele injeta no cabeçalho.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper de formatação
const parseEquipamento = (eq) => {
  let status = 'Sem Status';
  let modeloLimpo = eq.modelo || '';
  const match = modeloLimpo.match(/^\[(.*?)\]/);
  if (match) {
      status = match[1];
      modeloLimpo = modeloLimpo.replace(/^\[.*?\]\s*-?\s*/, '').trim();
  }
  return { ...eq, status, modeloLimpo };
};

// =====================================================================
// COMPONENTE PRINCIPAL (Contém toda a lógica e Rotas)
// =====================================================================
function SistemaTI() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado que define se o usuário tem privilégios de edição
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_token'));

  // Estados Globais de Dados
  const [estacoes, setEstacoes] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState('');

  // Modais e Filtros
  const [modalAberto, setModalAberto] = useState(false);
  const [estacaoSelecionada, setEstacaoSelecionada] = useState(null);
  const [filtroVincular, setFiltroVincular] = useState('Todos');
  const [filtroEstoque, setFiltroEstoque] = useState('Todos');
  const [modalEstoque, setModalEstoque] = useState(false);
  const [formEstoque, setFormEstoque] = useState({ id: null, tipo: 'Computador', modelo: '', condicao: 'Novo', patrimonio: 'PENDENTE' });

  // Puxa os dados da API ao iniciar
  const carregarDados = () => {
    Promise.all([
      axios.get('http://127.0.0.1:5000/api/estacoes'),
      axios.get('http://127.0.0.1:5000/api/estoque'),
      axios.get('http://127.0.0.1:5000/api/historico')
    ]).then(([resEst, resEstq, resLogs]) => {
      setEstacoes(resEst.data || []);
      setEstoque(resEstq.data || []);
      setLogs(resLogs.data || []);
    }).catch(err => console.error("Erro ao carregar dados:", err));
  };

  useEffect(() => { carregarDados(); }, []);

  // --- LÓGICA DE LOGIN / LOGOUT ---
  const [formLogin, setFormLogin] = useState({ usuario: '', senha: '' });
  const [erroLogin, setErroLogin] = useState('');

  const fazerLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/login', formLogin);
      localStorage.setItem('admin_token', res.data.token); // Salva o crachá
      setIsAdmin(true); // Libera os botões de edição
      navigate('/'); // Volta pro início
    } catch (error) {
      setErroLogin('Usuário ou senha incorretos.');
    }
  };

  const fazerLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdmin(false);
    navigate('/');
  };

  // --- LÓGICA DE CRUD DE EQUIPAMENTOS ---
  const atualizarEquipamento = async (eq_id, modelo, patrimonio) => {
    try { await axios.put(`http://127.0.0.1:5000/api/equipamento/${eq_id}`, { modelo, patrimonio }); carregarDados(); } 
    catch(e) { alert("Sessão expirada. Faça login novamente."); fazerLogout(); }
  };

  const removerParaEstoque = async (eq_id) => {
    if (!window.confirm("Remover da mesa e enviar para o Estoque?")) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/equipamento/${eq_id}`);
      carregarDados(); setModalAberto(false);
    } catch(e) { alert("Acesso Negado."); }
  };

  const vincularDoEstoque = async (eq_id) => {
    try {
      await axios.post(`http://127.0.0.1:5000/api/equipamento/${eq_id}/vincular`, { estacao_id: estacaoSelecionada.id });
      setModalAberto(false); carregarDados();
    } catch(e) { alert("Acesso Negado."); }
  };

  const salvarEstoque = async (e) => {
    e.preventDefault();
    if (!formEstoque.tipo || !formEstoque.modelo) return alert("Preencha tipo e modelo!");
    const modeloFinal = formEstoque.condicao !== 'Sem Status' && formEstoque.condicao.trim() !== ''
      ? `[${formEstoque.condicao}] ${formEstoque.modelo}` : formEstoque.modelo;

    try {
      if (formEstoque.id) {
        await atualizarEquipamento(formEstoque.id, modeloFinal, formEstoque.patrimonio);
      } else {
        await axios.post('http://127.0.0.1:5000/api/equipamento', { tipo: formEstoque.tipo, modelo: modeloFinal, patrimonio: formEstoque.patrimonio || "PENDENTE" });
      }
      setModalEstoque(false); carregarDados();
    } catch(e) { alert("Erro ao salvar. Verifique se está logado como admin."); }
  };

  // Modais de tela
  const abrirModalEstacao = (est) => { setEstacaoSelecionada(est); setFiltroVincular('Todos'); setModalAberto(true); };
  const abrirModalCriarEstoque = () => { setFormEstoque({ id: null, tipo: 'Computador', modelo: '', condicao: 'Novo', patrimonio: 'PENDENTE' }); setModalEstoque(true); };
  const abrirModalEditarEstoque = (eq) => {
    const parsed = parseEquipamento(eq);
    setFormEstoque({ id: eq.id, tipo: parsed.tipo, modelo: parsed.modeloLimpo, condicao: parsed.status === 'Sem Status' ? 'Novo' : parsed.status, patrimonio: eq.patrimonio });
    setModalEstoque(true);
  };

  // Filtros em memória
  const estacoesFiltradas = estacoes.filter(est => est.local.toLowerCase().includes(busca.toLowerCase()) || est.equipamentos.some(eq => (eq.patrimonio || '').toLowerCase().includes(busca.toLowerCase()) || (eq.modelo || '').toLowerCase().includes(busca.toLowerCase())));
  const filtrarLista = (lista, filtro) => {
    return lista.filter(eq => {
      const b = busca.toLowerCase();
      if (!((eq.patrimonio || '').toLowerCase().includes(b) || (eq.modelo || '').toLowerCase().includes(b))) return false;
      if (filtro === 'Todos') return true;
      const t = (eq.tipo || '').toLowerCase();
      if (filtro === 'Computadores') return t === 'computador';
      if (filtro === 'Monitores') return t.includes('monitor');
      if (filtro === 'Notebooks') return t === 'notebook';
      if (filtro === 'Extras') return !['computador', 'monitor', 'notebook'].some(x => t.includes(x));
      return true;
    });
  };

  const estoqueFiltrado = filtrarLista(estoque, filtroEstoque);
  const estoqueParaVincular = filtrarLista(estoque, filtroVincular);
  const totalAtivos = estoque.length + estacoes.reduce((acc, est) => acc + (est.equipamentos?.length || 0), 0);
  const totalPendentes = estoque.filter(e => e.patrimonio === 'PENDENTE').length + estacoes.reduce((acc, est) => acc + (est.equipamentos?.filter(eq => eq.patrimonio === 'PENDENTE').length || 0), 0);

  // Define se o menu lateral deve sumir (ex: tela de login limpa)
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="app-layout">
      
      {/* MENU LATERAL (Renderiza apenas se não for a tela de Login) */}
      {!isLoginPage && (
        <aside className="sidebar">
          <div className="sidebar-logo"><HardDrive size={24} style={{ marginRight: '8px' }}/> PGE | Controle de estoque</div>
          <nav style={{ flex: 1 }}>
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}><Activity size={20} /> Dashboard</Link>
            <Link to="/estacoes" className={`nav-item ${location.pathname === '/estacoes' ? 'active' : ''}`}><LayoutDashboard size={20} /> Estações</Link>
            <Link to="/estoque" className={`nav-item ${location.pathname === '/estoque' ? 'active' : ''}`}><Package size={20} /> Estoque ({estoque.length})</Link>
            <Link to="/atividade" className={`nav-item ${location.pathname === '/atividade' ? 'active' : ''}`}><Clock size={20} /> Atividade</Link>
          </nav>

          {/* Botão de Admin no rodapé da Sidebar */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {isAdmin ? (
              <button onClick={fazerLogout} className="nav-item" style={{ background:'transparent', border:'none', width:'100%', color:'#f87171' }}>
                <LogOut size={20} /> Sair do Modo Admin
              </button>
            ) : (
              <Link to="/login" className="nav-item" style={{ color: '#60a5fa' }}><Lock size={20} /> Acesso Restrito</Link>
            )}
          </div>
        </aside>
      )}

      {/* ÁREA PRINCIPAL COM ROTEAMENTO */}
      <main className="main-content">
        {!isLoginPage && <header className="header"><div className="header-title">Controle de Ativos PGE-ES {isAdmin && <span style={{fontSize:'0.8em', background:'var(--accent)', color:'white', padding:'3px 8px', marginLeft:'10px'}}>MODO ADMIN</span>}</div></header>}

        <div className="page-content" style={isLoginPage ? { display: 'flex', justifyContent: 'center', alignItems: 'center' } : {}}>
          <Routes>
            
            {/* TELA 1: LOGIN */}
            <Route path="/login" element={
              <div style={{ width: '100%', maxWidth: '400px', background: '#fff', padding: '40px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e0e0e0' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}><Lock size={40} color="var(--primary)" /> <h2 style={{ color: 'var(--primary)', marginTop: '10px', textTransform:'uppercase' }}>Acesso Restrito</h2></div>
                <form onSubmit={fazerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input type="text" placeholder="Usuário (tente: admin)" value={formLogin.usuario} onChange={e => setFormLogin({...formLogin, usuario: e.target.value})} style={{ padding: '12px', border: '1px solid #ccc', outline: 'none' }} required />
                  <input type="password" placeholder="Senha (tente: pge@123)" value={formLogin.senha} onChange={e => setFormLogin({...formLogin, senha: e.target.value})} style={{ padding: '12px', border: '1px solid #ccc', outline: 'none' }} required />
                  {erroLogin && <span style={{ color: 'var(--accent)', fontSize: '0.85em', fontWeight: 'bold' }}>{erroLogin}</span>}
                  <button type="submit" className="btn-action" style={{ padding: '15px', marginTop: '10px' }}>Entrar</button>
                  <Link to="/" style={{ textAlign: 'center', marginTop: '15px', color: '#666', textDecoration: 'none', fontSize: '0.9em' }}>Voltar ao modo leitura</Link>
                </form>
              </div>
            } />

            {/* TELA 2: DASHBOARD */}
            <Route path="/" element={
              <div className="dashboard-view">
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-icon"><HardDrive size={24}/></div><div className="stat-info"><h3>Total de Ativos</h3><p>{totalAtivos}</p></div></div>
                  <div className="stat-card"><div className="stat-icon" style={{color:'var(--accent)'}}><AlertCircle size={24}/></div><div className="stat-info"><h3>Pendentes de Tombo</h3><p>{totalPendentes}</p></div></div>
                  <div className="stat-card"><div className="stat-icon" style={{color:'#16a34a'}}><Package size={24}/></div><div className="stat-info"><h3>No Estoque de TI</h3><p>{estoque.length}</p></div></div>
                </div>
                <div className="table-container" style={{marginTop:'30px'}}>
                  <h2 style={{padding:'20px', fontSize: '1.1em', fontWeight: 700, textTransform: 'uppercase'}}>Atividade Recente</h2>
                  <div style={{padding:'0 20px 20px'}}>
                    {logs.slice(0,10).map((l,i) => <div key={i} style={{padding:'10px', borderBottom:'1px solid #eee', fontSize:'0.9rem'}}><strong>{l.data}</strong> - {l.acao}</div>)}
                  </div>
                </div>
              </div>
            } />

            {/* TELA 3: ESTAÇÕES */}
            <Route path="/estacoes" element={
              <div className="table-container">
                <div className="table-header-actions">
                  <h2>Mapeamento de Estações</h2>
                  <div className="search-box"><Search size={18} color="#999" /><input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
                </div>
                <table className="data-table">
                  <thead><tr><th>Local (Setor/Sala)</th><th>Computador</th><th>Monitor(es)</th><th>Notebook</th><th>Extras</th>{isAdmin && <th>Ações</th>}</tr></thead>
                  <tbody>
                    {estacoesFiltradas.map(est => {
                      const pcs = est.equipamentos.filter(eq => eq.tipo.toLowerCase() === 'computador');
                      const mons = est.equipamentos.filter(eq => eq.tipo.toLowerCase().includes('monitor'));
                      const nbs = est.equipamentos.filter(eq => eq.tipo.toLowerCase() === 'notebook');
                      const ex = est.equipamentos.filter(eq => !['computador', 'monitor', 'notebook'].some(t => eq.tipo.toLowerCase().includes(t)));
                      return (
                        <tr key={est.id}>
                          <td><strong>{est.local}</strong></td>
                          <td>{pcs.map(eq => <span key={eq.id} className="badge pc">{eq.patrimonio}</span>)}</td>
                          <td>{mons.map(eq => <span key={eq.id} className="badge monitor" style={{marginRight:4}}>{eq.patrimonio}</span>)}</td>
                          <td>{nbs.map(eq => <span key={eq.id} className="badge" style={{background:'#fef3c7'}}>{eq.patrimonio}</span>)}</td>
                          <td>{ex.map(eq => <span key={eq.id} className="badge">{eq.tipo}</span>)}</td>
                          {/* Só mostra o botão se for Admin */}
                          {isAdmin && <td><button className="btn-action" onClick={() => abrirModalEstacao(est)}>Opções</button></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            } />

            {/* TELA 4: ESTOQUE */}
            <Route path="/estoque" element={
              <div className="table-container">
                <div className="table-header-actions">
                  {/* Botão Novo Ativo Oculto para visitantes */}
                  <div style={{ width: '150px' }}>{isAdmin && <button onClick={abrirModalCriarEstoque} className="btn-action">+ Novo Ativo</button>}</div>
                  <div className="search-box"><Search size={18} color="#999" /><input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
                </div>
                <div style={{display:'flex', gap:'10px', padding:'10px 20px', background:'#f8fafc'}}>
                  {['Todos', 'Computadores', 'Monitores', 'Notebooks', 'Extras'].map(f => (
                    <button key={f} onClick={() => setFiltroEstoque(f)} style={{padding:'5px 12px', border:'none', background: filtroEstoque === f ? 'var(--primary)' : 'transparent', color: filtroEstoque === f ? '#fff' : '#666', cursor:'pointer', fontWeight: 600}}>{f}</button>
                  ))}
                </div>
                <table className="data-table">
                  <thead><tr><th>Tipo</th><th>Modelo</th><th>Condição</th><th>Patrimônio</th>{isAdmin && <th>Ações</th>}</tr></thead>
                  <tbody>
                    {estoqueFiltrado.map(eq => {
                      const p = parseEquipamento(eq);
                      return (
                        <tr key={eq.id}>
                          <td><span className="badge pc">{eq.tipo}</span></td>
                          <td>{p.modeloLimpo}</td>
                          <td>{p.status}</td>
                          <td><strong>{eq.patrimonio}</strong></td>
                          {isAdmin && <td><button className="btn-action" onClick={() => abrirModalEditarEstoque(eq)}><Edit size={14}/></button></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            } />

            {/* TELA 5: ATIVIDADE */}
            <Route path="/atividade" element={
              <div className="table-container">
                 <h2 style={{padding:'20px', fontSize: '1.1em', fontWeight: 700, textTransform: 'uppercase'}}>Logs de Auditoria</h2>
                 <div style={{padding:'0 20px 20px'}}>
                    {logs.map((log, i) => (
                      <div key={i} style={{padding:'12px', borderBottom:'1px solid #eee', fontSize:'0.9rem'}}><Clock size={14} style={{marginRight:10}}/><strong>{log.data}</strong> - {log.acao}</div>
                    ))}
                 </div>
              </div>
            } />

          </Routes>
        </div>
      </main>

      {/* MODAL GERIR ESTAÇÃO (Só abre se for Admin, mas a trava extra está aqui por garantia) */}
      {modalAberto && estacaoSelecionada && isAdmin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
          <div style={{background:'#fff', width:'800px', maxHeight:'90vh', overflowY:'auto', padding:'30px', boxShadow:'0 20px 25px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:15, marginBottom:20}}>
              <h2 style={{color: 'var(--primary)'}}>Estação: {estacaoSelecionada.local}</h2>
              <button onClick={() => setModalAberto(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
            </div>
            <h3 style={{fontSize: '1em', textTransform: 'uppercase', color: '#444'}}>Equipamentos Instalados</h3>
            <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:15}}>
              {estacaoSelecionada.equipamentos.map(eq => (
                <div key={eq.id} style={{display:'flex', justifyContent:'space-between', padding:15, background:'#f8fafc', border:'1px solid #e2e8f0'}}>
                  <span><strong>{eq.tipo}</strong>: {eq.modelo} ({eq.patrimonio})</span>
                  <button onClick={() => removerParaEstoque(eq.id)} style={{color:'var(--accent)', background:'none', border:'none', cursor:'pointer'}}><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
            <div style={{marginTop:30, borderTop:'1px dashed #ccc', paddingTop:20}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                <h3 style={{fontSize: '1em', textTransform: 'uppercase', color: '#444'}}>Instalar do Estoque</h3>
                <div style={{display:'flex', gap:5}}>
                  {['Todos', 'Computadores', 'Monitores', 'Notebooks'].map(f => (
                    <button key={f} onClick={() => setFiltroVincular(f)} style={{fontSize:12, padding:'4px 10px', border:'none', background: filtroVincular === f ? 'var(--primary)' : '#eee', color: filtroVincular === f ? '#fff' : '#333', cursor:'pointer', fontWeight: 600}}>{f}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                {estoqueParaVincular.slice(0,12).map(eq => (
                  <div key={eq.id} style={{padding:10, border:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontSize:'0.85rem'}}>{eq.modelo} ({eq.patrimonio})</span>
                    <button onClick={() => vincularDoEstoque(eq.id)} style={{padding:'6px 10px', background:'var(--primary)', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer', fontSize: '0.8em'}}>Instalar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORMULÁRIO ESTOQUE */}
      {modalEstoque && isAdmin && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1001}}>
          <div style={{background:'#fff', width:'450px', padding:30}}>
            <h2 style={{marginBottom:20, color: 'var(--primary)', textTransform: 'uppercase', fontSize: '1.1em'}}>{formEstoque.id ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
            <form onSubmit={salvarEstoque} style={{display:'flex', flexDirection:'column', gap:15}}>
              <select value={formEstoque.tipo} onChange={e => setFormEstoque({...formEstoque, tipo: e.target.value})} style={{padding:10, border:'1px solid #ccc', outline: 'none'}}>
                <option>Computador</option><option>Monitor</option><option>Notebook</option><option>Impressora</option><option>TV</option>
              </select>
              <select value={formEstoque.condicao} onChange={e => setFormEstoque({...formEstoque, condicao: e.target.value})} style={{padding:10, border:'1px solid #ccc', outline: 'none'}}>
                <option>Novo</option><option>Usado (Disponível pra uso)</option><option>Com defeito</option><option>Sem Status</option>
              </select>
              <input type="text" placeholder="Modelo" value={formEstoque.modelo} onChange={e => setFormEstoque({...formEstoque, modelo: e.target.value})} style={{padding:10, border:'1px solid #ccc', outline: 'none'}} />
              <input type="text" placeholder="Patrimônio" value={formEstoque.patrimonio} onChange={e => setFormEstoque({...formEstoque, patrimonio: e.target.value})} style={{padding:10, border:'1px solid #ccc', outline: 'none'}} />
              <div style={{display:'flex', gap:10, marginTop: 10}}>
                <button type="button" onClick={() => setModalEstoque(false)} style={{flex:1, padding:12, background:'#eee', border:'none', cursor:'pointer', fontWeight: 600, color: '#444'}}>Cancelar</button>
                <button type="submit" style={{flex:1, padding:12, background:'var(--primary)', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer'}}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// O App final apenas envelopa tudo no Router do React-Router-DOM
export default function App() {
  return (
    <Router>
      <SistemaTI />
    </Router>
  );
}