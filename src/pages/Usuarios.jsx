import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Usuarios = ({ usuarios, atualizarStatusUsuario, fetchLeadsFechadosFromSheet, fetchLeadsFromSheet }) => {
  const [senhaVisivel, setSenhaVisivel] = useState({});

  const handleToggleStatus = (id, statusAtual) => {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    atualizarStatusUsuario(id, novoStatus);
  };

  const handleToggleTipo = (id, tipoAtual) => {
    const novoTipo = tipoAtual === 'Admin' ? 'Usuário Comum' : 'Admin';
    atualizarStatusUsuario(id, null, novoTipo);
  };

  const toggleVisibilidadeSenha = (id) => {
    setSenhaVisivel((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-indigo-700">Gerenciar Usuários</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md">
          <thead className="bg-indigo-100">
            <tr>
              <th className="py-3 px-6 text-left">Nome</th>
              <th className="py-3 px-6 text-left">E-mail</th>
              <th className="py-3 px-6 text-left">Senha</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Tipo</th>
              <th className="py-3 px-6 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-b hover:bg-gray-50 transition">
                <td className="py-3 px-6">{usuario.nome}</td>
                <td className="py-3 px-6">{usuario.email}</td>
                <td className="py-3 px-6">
                  <div className="flex items-center gap-2">
                    <input
                      type={senhaVisivel[usuario.id] ? 'text' : 'password'}
                      value={usuario.senha}
                      readOnly
                      className="border rounded px-2 py-1 w-32 text-sm"
                    />
                    <button
                      onClick={() => toggleVisibilidadeSenha(usuario.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {senhaVisivel[usuario.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-6">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      usuario.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {usuario.status}
                  </span>
                </td>
                <td className="py-3 px-6">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      usuario.tipo === 'Admin' ? 'bg-blue-100 text-blue-700' : ''
                    }`}
                  >
                    {usuario.tipo === 'Admin' ? 'Admin' : 'Usuário Comum'}
                  </span>
                </td>
                <td className="py-3 px-6 flex gap-4 items-center">
                  <button
                    onClick={() => handleToggleStatus(usuario.id, usuario.status)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      usuario.status === 'Ativo'
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    } transition`}
                  >
                    {usuario.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                  </button>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={usuario.tipo === 'Admin'}
                      onChange={() => handleToggleTipo(usuario.id, usuario.tipo)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    Admin
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Usuarios;
