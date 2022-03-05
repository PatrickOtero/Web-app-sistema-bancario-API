const { banco, contas, saques, depositos, transferencias } = require("../Dados/bancodedados.js");
const { format } = require("date-fns");

let idGerado = 0;

function validarCampos (body) {
  if (!body.nome) return "Campo 'nome' é obrigatório";
  if (!body.cpf) return "Campo 'cpf' é obrigatório";
  if (!body.data_nascimento) return "Campo 'data_nascimento' é obrigatório";
  if (!body.telefone) return "Campo 'telefone' é obrigatório";
  if (!body.email) return "Campo 'email' é obrigatório";
  if (!body.senha) return "Campo 'senha' é obrigatório";

  if (typeof body.nome !== "string") return "Campo 'nome' em formato inválido";
  if (typeof body.cpf !== "string") return "Campo 'cpf' em formato inválido";
  if (typeof body.data_nascimento !== "string") return "Campo 'data_nascimento' em formato inválido";
  if (typeof body.telefone !== "string") return "Campo 'telefone' em formato inválido";
  if (typeof body.email !== "string") return "Campo 'email' em formato inválido";
  if (typeof body.senha !== "string") return "Campo 'senha' em formato inválido";

  const cpfTratado = body.cpf.trim();
  const telefoneTratado = body.telefone.trim();
  
  if (isNaN(cpfTratado) == true) return "Insira apenas números no campo 'cpf', sem espaçamento";
  if (cpfTratado.length !== 11) return "O campo 'cpf' deve conter 11(onze) números, sem espaçamento";
  if (isNaN(telefoneTratado) == true) return "Por favor, insira apenas números no campo de telefone no formato 'dddXXXXXXXXX'";
  if (body.senha.includes(" ") == true) return "O campo 'senha' não aceita espaçamento";
}

function validarFormatoEmail (body) {
  const email = body.email.split("@");

  if (email.length !== 2 || email[0].length < 3 || email[1].length < 3 || email[0].includes(" ") == true || email[0][email[0].length-1] === "." || email[0][0] === "." || email[1].includes(" ") == true || email[1].includes(".") == false || email[1].indexOf(".") < 1 || email[1].lastIndexOf(".") >= email[1].length - 1) return "Por favor, insira um e-mail em um formato válido";
}

function validarFormatoData (body) {
  const date = body.data_nascimento.trim();
  const split = body.data_nascimento.split("-");

 if (!Date.parse(body.data_nascimento) || date !== body.data_nascimento || body.data_nascimento.includes(" ") || split.length !== 3 || split[0].length !== 4 || split[1].length !== 2 || split[2].length !== 2) return "Campo 'data_nascimento' inválido, insira apenas números e dois traços('-') no formato 'aaaa-mm-dd' (4(quatro) dígitos para o ano, 2(dois) dígitos para um mês válido e 2(dois) dígitos para um dia válido";
 if (Number(split[0]) < 1895) return "Data muito antiga, reveja o campo 'data_nascimento";
}

function validarCpfEmailPost (body, array) {
  const cpfTrim = body.cpf.trim();

  const temCpf = array.find(conta => conta.usuario.cpf === cpfTrim);
  const temEmail = array.find(conta => conta.usuario.email === body.email);

  if (temCpf) return "Este cpf já foi inserido por outro usuario"
  if (temEmail) return "Este e-mail já foi inserido por outro usuario";
}

function validarCpfeEmailPut (body, param, array) {
  const cpfTrim = body.cpf.trim();
  const temCpf = array.find(conta => conta.usuario.cpf === cpfTrim && conta.numero !== param);
  const temEmail = array.find(conta => conta.usuario.email === body.email && conta.numero !== param);

  if (temCpf) return "Este cpf já foi inserido por outro usuario"
  if (temEmail) return "Este e-mail já foi inserido por outro usuario";
}

function validarFormatoNome (body) {
  const nomeTratado = body.nome.trim();
  const nomeFinal1 = nomeTratado[0].toUpperCase() + nomeTratado.substr(1);

  if (nomeTratado.includes(" ") == true ) {
    const nomeCompleto = nomeTratado.split(" ");
    const nomeCompletoTratado = nomeCompleto.filter(parte => parte)

    for (let i = 0; i < nomeCompletoTratado.length; i++) {
      if (typeof nomeCompletoTratado[i][0] !== "number") nomeCompletoTratado[i] = nomeCompletoTratado[i][0].toUpperCase() + nomeCompletoTratado[i].substr(1);
    }

    const nomeFinal2 = nomeCompletoTratado.join(" ");
    return nomeFinal2;
  }
  return nomeFinal1;
}

function procurarEValidarNumeroUsuario (param, array) { 
  const oUsuario = array.find(conta => conta.numero === param);

  if (!param) return "É necessário passar o número da conta pela query 'numero_conta' na URL ou pelo campo 'numero_conta' ou 'numero_conta_origem'";
  if (isNaN(param) == true) return "Insira apenas números no número da conta";
  if (typeof param !== "string") return "Número da conta em formato inválido";
  if (!oUsuario) return "Não existe uma conta com este número registrada neste banco";
}

function validarContaTransacao (contaNumero) {
  if (!contaNumero) return "O campo 'numero_conta' ou 'numero_conta_origem' é obrigatório"
  if (typeof contaNumero !== "string") return "campo 'numero_conta', ou 'numero_conta_origem' em formato inválido";
  if (isNaN(contaNumero) == true) return "Insira apenas números no campo 'numero_conta' ou 'numero_conta_origem'";
}

function validarValorTransacao (valorTransacao, array, param) {
  if (valorTransacao === undefined) return "O campo 'valor' é obrigatório";
  if (typeof valorTransacao !== "number") return "Campo 'valor' em formato inválido";
  if (valorTransacao <= 0) return "insira um valor maior que zero no campo 'valor'";
}

function validarSenhaTransacao (body, array, param, param2) {
  const oUsuario = array.find(conta => conta.numero === param);
  
  if (!oUsuario) return "Conta inexistente"
  if (!param2) return "A query 'senha' na URL ou o campo 'senha' é obrigatório";
  if (typeof param2 !== "string") return "Query 'senha' na URL ou o campo 'senha' em formato inválido";
  if (oUsuario.usuario.senha !== param2) return "Senha incorreta";
}

function listarContasBancarias(req, res) {
  const { senha_banco } = req.query;

  if (!senha_banco) return res.status(401).json({mensagem: "Campo query 'senha_banco' na URL é obrigatório para autenticação via senha, acesso negado"});
  if (senha_banco !== banco.senha) return res.status(401).json({mensagem: "A senha inserida está incorreta, acesso negado" });

  res.status(200).json(contas);
}

function criarContaBancaria(req, res) {
    const { nome, cpf, data_nascimento, telefone, email, senha } =
    req.body;

    const mensagem1 = validarCampos(req.body);
    if (mensagem1) return res.status(400).json({ mensagem: mensagem1 });

    const mensagem2 = validarCpfEmailPost(req.body, contas);
    if (mensagem2) return res.status(400).json({ mensagem: mensagem2 });

    const mensagem3 = validarFormatoData(req.body);
    if (mensagem3) return res.status(400).json({ mensagem: mensagem3 });

    const mensagem4 = validarFormatoEmail(req.body);
    if (mensagem4) return res.status(400).json({ mensagem: mensagem4 });

    ++idGerado
    contas.push({
      numero: `${idGerado}`,
      saldo: 0,
      usuario: {
        nome: validarFormatoNome(req.body),
        cpf: cpf.trim(),
        data_nascimento: data_nascimento,
        telefone: telefone.trim(),
        email: email,
        senha: senha,
      },
    });

    res.status(204).send();
}

function atualizarContaBancaria (req, res) {
  const numeroConta = req.params.numeroConta;
  const { nome, cpf, data_nascimento, telefone, email, senha } =
  req.body;

  const oUsuario = contas.find(conta => conta.numero === numeroConta);

  const mensagem1 = procurarEValidarNumeroUsuario(numeroConta, contas);
  if (mensagem1) return res.status(404).json({ mensagem: mensagem1 });

  const mensagem2 = validarCampos(req.body);
  if (mensagem2) return res.status(404).json({ mensagem: mensagem2 });

  const mensagem3 = validarCpfeEmailPut(req.body, numeroConta, contas);
  if (mensagem3) return res.status(404).json({ mensagem: mensagem3 });

  const mensagem4 = validarFormatoData(req.body);
  if (mensagem4) return res.status(404).json({ mensagem: mensagem4 });

  const mensagem5 = validarFormatoEmail(req.body);
  if (mensagem5) return res.status(404).json({ mensagem: mensagem5 });


  oUsuario.usuario.nome = validarFormatoNome(req.body);
  oUsuario.usuario.cpf = cpf.trim();
  oUsuario.usuario.data_nascimento = data_nascimento;
  oUsuario.usuario.telefone = telefone.trim();
  oUsuario.usuario.email = email;
  oUsuario.usuario.senha = senha;

  res.status(204).send();
}

function excluirContaBancaria (req, res) {
  const numeroConta = req.params.numeroConta;
  const oUsuario = contas.find(conta => conta.numero === numeroConta);
  const indice = contas.indexOf(oUsuario);

  const mensagem1 = procurarEValidarNumeroUsuario(numeroConta, contas);
  if (mensagem1) return res.status(400).json({ mensagem: mensagem1 });

  if (oUsuario.saldo !== 0) return res.status(400).json({ mensagem: "Só é permitido excluir contas bancárias cujos saldos estão zerados"});

  contas.splice(indice, 1);

  res.status(204).send();
}

function depositar (req, res) {
  const { numero_conta, valor } = req.body;
  const oUsuario = contas.find(conta => conta.numero === numero_conta);
 
  const mensagem1 = procurarEValidarNumeroUsuario(numero_conta, contas);
  if (mensagem1) return res.status(400).json({ mensagem: mensagem1 });

  const mensagem2 = validarContaTransacao(numero_conta);
  if (mensagem2) return res.status(400).json({ mensagem: mensagem2 });

  const mensagem3 = validarValorTransacao(valor, contas, numero_conta);
  if (mensagem3) return res.status(400).json({ mensagem: mensagem3 });

  oUsuario.saldo = oUsuario.saldo + valor;
  depositos.push({
    data: format(new Date(), "yyyy'-'MM'-'dd' 'HH':'mm':'ss"),
    numero_conta,
    valor,
  });

  res.status(204).send();
}

function sacar (req, res) {
  const { numero_conta, valor, senha } = req.body;
  const oUsuario = contas.find(conta => conta.numero === numero_conta);

  const mensagem1 = procurarEValidarNumeroUsuario(numero_conta, contas);
  if (mensagem1) return res.status(400).json({ mensagem: mensagem1 });

  const mensagem2 = validarContaTransacao(numero_conta);
  if (mensagem2) return res.status(400).json({ mensagem: mensagem2 });

  const mensagem3 = validarValorTransacao(valor, contas, numero_conta);
  if (mensagem3) return res.status(400).json({ mensagem: mensagem3 });

  const mensagem4 = validarSenhaTransacao(req.body, contas, numero_conta, senha);
  if (mensagem4) return res.status(400).json({ mensagem: mensagem4 });

  if (oUsuario.saldo < valor || oUsuario.saldo === 0) return res.status(400).json({mensagem: "saldo insuficiente"});

  oUsuario.saldo = oUsuario.saldo - valor;
  saques.push({
    data: format(new Date(), "yyyy'-'MM'-'dd' 'HH':'mm':'ss"),
    numero_conta,
    valor,
  });

res.status(204).send();
}

function transferir (req, res) {
  const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

  const mensagem1 = procurarEValidarNumeroUsuario(numero_conta_origem, contas);
  if (mensagem1) return res.status(400).json({ mensagem: mensagem1 });

  const mensagem2 = validarContaTransacao(numero_conta_origem);
  if (mensagem2) return res.status(400).json({ mensagem: mensagem2 });

  const mensagem3 = validarValorTransacao(valor, contas, numero_conta_origem);
  if (mensagem3) return res.status(400).json({ mensagem: mensagem3 });

  const mensagem4 = validarSenhaTransacao(req.body, contas, numero_conta_origem, senha)
  if (mensagem4) return res.status(400).json({ mensagem: mensagem4 });

  const usuarioOrigem = contas.find(conta => conta.numero === numero_conta_origem);
  const usuarioDestino = contas.find(conta => conta.numero === numero_conta_destino);
  
  if (!numero_conta_destino) return res.status(400).json({ mensagem: "O campo 'numero_conta_destino' é obrigatório" });
  if (typeof numero_conta_destino !== "string") return res.status(400).json({ mensagem: "Campo numero_conta_origem em formato inválido"});
  if (isNaN(numero_conta_destino) == true) return res.status(400).json({mensagem: "Insira apenas números no campo numero_conta_destino"});
  if (numero_conta_origem === numero_conta_destino) return res.status(400).json({mensagem: "Campo 'numero_conta_destino' precisa ser diferente do campo 'numero_conta_origem" });
  if (!usuarioDestino) return res.status(404).json({ mensagem: "Conta de destino inexistente" });
  if (usuarioOrigem.saldo < valor || usuarioOrigem.saldo === 0) return res.status(400).json({mensagem: "saldo insuficiente"});

  usuarioOrigem.saldo = usuarioOrigem.saldo - valor;
  usuarioDestino.saldo = usuarioDestino.saldo + valor;

  transferencias.push({
    data: format(new Date(), "yyyy'-'MM'-'dd' 'HH':'mm':'ss"),
    numero_conta_origem,
    numero_conta_destino,
    valor,
  });

  res.status(204).send();
}

function consultarSaldo (req, res) {
  const { numero_conta, senha } = req.query;
  const oUsuario = contas.find(conta => conta.numero === numero_conta);

  const mensagem1 = procurarEValidarNumeroUsuario(numero_conta, contas);
  if (mensagem1) return res.status(400).json({ mensagem: mensagem1 });

  const mensagem2 = validarContaTransacao(numero_conta);
  if (mensagem2) return res.status(400).json({ mensagem: mensagem2 });

  const mensagem3 = validarSenhaTransacao(req.body, contas, numero_conta, senha);
  if (mensagem3) return res.status(400).json({ mensagem: mensagem3 });

  res.status(200).json({
    saldo: oUsuario.saldo
  });
}

function exibirExtrato (req, res) {
  const { numero_conta, senha } = req.query;

  const mensagem1 = procurarEValidarNumeroUsuario(numero_conta, contas);
  if (mensagem1) return res.status(400).json({ mensagem: mensagem1 });

  const mensagem2 = validarContaTransacao(numero_conta);
  if (mensagem2) return res.status(400).json({ mensagem: mensagem2 });

  const mensagem3 = validarSenhaTransacao(req.body, contas, numero_conta, senha);
  if (mensagem3) return res.status(400).json({ mensagem: mensagem3 });

  const saquesDoUsuario = saques.filter(saque => saque.numero_conta === numero_conta);
  const depositosDoUsuario = depositos.filter(deposito => deposito.numero_conta === numero_conta);
  const transferenciasDoUsuario = transferencias.filter(transferencia1 => transferencia1.numero_conta_origem === numero_conta);
  const transferenciasDoUsuario2 = transferencias.filter(transferencia2 => transferencia2.numero_conta_destino === numero_conta);

  res.status(200).json({
    depositos: depositosDoUsuario,
    saques: saquesDoUsuario,
    transferenciasEnviadas: transferenciasDoUsuario,
    transferenciasRecebidas: transferenciasDoUsuario2
  });
}

module.exports = { listarContasBancarias, criarContaBancaria, atualizarContaBancaria, excluirContaBancaria, depositar, sacar, transferir, consultarSaldo, exibirExtrato };
