const express = require("express");
const { listarContasBancarias, criarContaBancaria, atualizarContaBancaria, excluirContaBancaria, depositar, sacar, transferir, consultarSaldo, exibirExtrato } = require("./Controladores/controllers");

const roteador = express();

roteador.get("/contas", listarContasBancarias);
roteador.post("/contas", criarContaBancaria);
roteador.put("/contas/:numeroConta/usuario", atualizarContaBancaria);
roteador.delete("/contas/:numeroConta", excluirContaBancaria);
roteador.post("/transacoes/depositar", depositar);
roteador.post("/transacoes/sacar", sacar);
roteador.post("/transacoes/transferir", transferir);
roteador.get("/contas/saldo", consultarSaldo);
roteador.get("/contas/extrato", exibirExtrato);

module.exports = roteador;
