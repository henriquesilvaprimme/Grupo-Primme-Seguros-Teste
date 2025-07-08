import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Importações de componentes
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';

// Contexto de Autenticação para gerenciar o estado do usuário logado
const AuthContext = createContext(null);

// URLs do Google Apps Script
// **ATENÇÃO:** SUBSTITUA ESTE VALOR PELO URL EXATO E MAIS RECENTE DA SUA IMPLANTAÇÃO DE WEB APP DO GOOGLE APPS SCRIPT.
// Ele deve terminar com '/exec'.
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; 

// Definição das URLs completas para as requisições
const GOOGLE_SHEETS_GET_USERS_URL = `${GOOGLE_SHEETS_BASE_URL}?v=pegar_usuario`;
const GOOGLE_SHEETS_ALTERAR_USUARIO_URL = `${GOOGLE_SHEETS_BASE_URL}?v=alterar_usuario`;
const GOOGLE_SHEETS_GET_LEADS_URL = `${GOOGLE_SHEETS_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_GET_CLOSED_LEADS_URL = `${GOOGLE_SHEETS_BASE_URL}?v=pegar_clientes_fechados`;
const GOOGLE_SHEETS_CREATE_LEAD_URL = `${GOOGLE_SHEETS_BASE_URL}?v=criar_lead`;
const GOOGLE_SHEETS_SAVE_LEAD_URL = `${GOOGLE_SHEETS_BASE_URL}?v=salvar_lead`;
const GOOGLE_SHEETS_TRANSFER_LEAD_URL = `${GOOGLE_SHEETS_BASE_URL}?v=transferir_lead`;
const GOOGLE_SHEETS_ALTERAR_SEGURADORA_URL = `${GOOGLE_SHEETS_BASE_URL}?v=alterar_seguradora`;
const GOOGLE_SHEETS_CREATE_USER_URL = `${GOOGLE_SHEETS_BASE_URL}?v=criar_usuario`;
const GOOGLE_SHEETS_RANKING_URL = `${GOOGLE_SHEETS_BASE_URL}?action=ranking_data`; // Note que este usa 'action' conforme seu GAS


// Provedor de Autenticação
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Tenta carregar o usuário do localStorage ao iniciar
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const navigate = useNavigate();

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData)); // Salva no localStorage
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user'); // Remove do localStorage
        navigate('/login'); // Redireciona para a página de login
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Componente principal da Aplicação
function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

// Componente para gerenciar as rotas
function AppRoutes() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    // Funções de fetch para o Google Apps Script
    // ===========================================

    // Função para buscar usuários
    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_GET_USERS_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro ao buscar usuários do Google Sheets:", error);
            return [];
        }
    }, []);

    // Função para buscar leads
    const fetchLeads = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_GET_LEADS_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro ao buscar leads da planilha:", error);
            return [];
        }
    }, []);

    // Função para buscar leads fechados
    const fetchClosedLeads = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_GET_CLOSED_LEADS_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro ao buscar leads fechados:", error);
            return [];
        }
    }, []);

    // Função para buscar dados de ranking
    const fetchRankingData = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_RANKING_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro ao buscar dados de ranking:", error);
            return [];
        }
    }, []);

    // Função para criar lead
    const createLead = useCallback(async (leadData) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_CREATE_LEAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar lead');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao criar lead:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para salvar (atualizar) status de lead
    const saveLead = useCallback(async (leadId, newStatus) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SAVE_LEAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: leadId, status: newStatus }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao salvar lead');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao salvar lead:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para transferir lead
    const transferLead = useCallback(async (leadId, newResponsavel) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_TRANSFER_LEAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lead: { id: leadId, responsavel: newResponsavel } }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao transferir lead');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao transferir lead:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para alterar detalhes da seguradora (e financeiro) de um lead fechado
    const alterarSeguradora = useCallback(async (leadData) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_ALTERAR_SEGURADORA_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lead: leadData }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao alterar seguradora');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao alterar seguradora:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para criar usuário
    const createUser = useCallback(async (userData) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_CREATE_USER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar usuário');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para alterar usuário (status e tipo)
    const alterarUsuario = useCallback(async (userData) => {
        try {
            // No seu GAS, a ação é 'alterar_usuario' e espera 'id', 'status', 'tipo' diretamente no body.
            const response = await fetch(GOOGLE_SHEETS_ALTERAR_USUARIO_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Envia o id, status e tipo diretamente no corpo.
                body: JSON.stringify({ 
                    id: userData.id, 
                    status: userData.status, 
                    tipo: userData.tipo 
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao alterar usuário');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao alterar usuário:", error);
            return { success: false, message: error.message };
        }
    }, []);


    useEffect(() => {
        // Redireciona com base no estado do usuário
        if (!user && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            navigate('/login');
        } else if (user && window.location.pathname === '/login') {
            if (user.tipo === 'Admin') {
                navigate('/admin-dashboard');
            } else if (user.tipo === 'Usuario' || user.tipo === 'Usuário Comum') {
                navigate('/user-dashboard');
            }
        }
    }, [user, navigate]);

    // Passa as funções de fetch para os componentes que as necessitam via props
    // ou useContext se preferir centralizar mais.
    return (
        <Routes>
            <Route path="/login" element={<Login onLogin={login} fetchUsers={fetchUsers} />} />
            <Route path="/register" element={<Register createUser={createUser} />} />
            {user && user.tipo === 'Admin' && (
                <Route
                    path="/admin-dashboard"
                    element={
                        <AdminDashboard
                            fetchUsers={fetchUsers}
                            fetchLeads={fetchLeads}
                            fetchClosedLeads={fetchClosedLeads}
                            fetchRankingData={fetchRankingData}
                            saveLead={saveLead}
                            transferLead={transferLead}
                            alterarSeguradora={alterarSeguradora}
                            alterarUsuario={alterarUsuario}
                        />
                    }
                />
            )}
            {user && (user.tipo === 'Usuario' || user.tipo === 'Usuário Comum') && (
                <Route
                    path="/user-dashboard"
                    element={
                        <UserDashboard
                            fetchLeads={fetchLeads}
                            fetchClosedLeads={fetchClosedLeads}
                            createLead={createLead}
                            saveLead={saveLead}
                            alterarSeguradora={alterarSeguradora}
                        />
                    }
                />
            )}
            <Route path="*" element={
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h1>404 - Página Não Encontrada</h1>
                    <p>Volte para a <a href="/login">página de login</a>.</p>
                </div>
            } />
        </Routes>
    );
}

export default App;
