const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

var acessos = 0;
var acessados = 0;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let users = [
    {
        "nome": "Gustavo Molina",
        "usuario": "preto",
        "senha": "123456",
        "estado": "off"
    },
];

let users_on = [];
let mensagens = [];

io.on('connection', (socket) => {
    console.log('Um cliente se conectou: ' + socket.id);
    acessados++;
    acessos++;
    console.log("Acessados agora: " + acessados);
    console.log("Acessos totais: " + acessos);
/*
    // No seu servidor Socket.IO
socket.on('sendMessageToUser', (data) => {
    const { senderId, receiverId, message } = data;

    // Encontrar o socket do destinatário na lista de usuários
    const receiverSocket = io.sockets.sockets.find(socket => socket.id === receiverId);

    if (receiverSocket) {
        // Emitir a mensagem para o socket do destinatário
        receiverSocket.emit('newmessage', { autor: senderId, mensagem: message });
    } else {
        console.log('Socket do destinatário não encontrado ou offline.');
        // Aqui você pode emitir um evento de erro de volta para o remetente, se desejar
    }
});
*/

    socket.on('newmessage', (arg)=>{
        mensagens.push(arg);
        io.emit('nova_mensagem', mensagens);
    });
    socket.on('newuser', (arg)=>{
        let uso = false;
        for(var i = 0; i < users.length; i++){
            if(arg.usuario === users[i].usuario){
                console.log("usuário ja existente");
                uso = true;
            }
        }
        let resposta = "O usuário "+arg.usuario+" já está sendo utilizado";
        if(uso === true){
            socket.emit('resposta_criar', resposta);
        }else{
            users.push(arg);
            console.log('Usuarios totais')
            console.log(users);
            let resposta = "Contra criada com sucesso";
            socket.emit('resposta_criar',resposta);
        }
    });
    socket.on('trylogin', (arg)=>{
        for(var r = 0; r < users.length; r++){
            if(users[r].usuario == arg.user_try){ //verifica se o usuario existe
                console.log("Usuário "+arg.user_try+ " encontrado");
                if(users[r].senha == arg.password_try){ //verifica se a senha está correta
                    console.log("Senha correta")
                    if(users[r].estado == "on"){
                        console.log('A conta ja está logada!');
                        socket.emit('user_em_uso', "[ERROR] O login ao qual está tentando entrar ja está sendo utilizado agora");
                        return;
                    }else{
                        users[r].estado = "on"; // altera o estado da conta para "on"
                        users[r].id = socket.id; //atribui o id atual a conta
                        console.log(users[r]);
                        socket.emit('conectado', users[r]);//envia ao usuário suas informações
                        socket.emit('mensagens_anteriores', mensagens); //envia ao usuário as mensagens anteriores
                        for(var e = 0; e < users.length; e++){
                            if(users[e].estado === "on"){//procura dentre todas as contas os usuários com estado "on"
                                if(users_on.includes(users[e]) === true){ //verifica se o usuario ja esta armazenado na array de users online
                                    console.log("usuário já esta na array");
                                }else{ //Caso não esteja...
                                    users_on.push(users[e]); //...adiciona a conta encontrada na lista de usuarios online
                                    console.log("users online");
                                    console.table(users_on)
                                }
                            }
                        }
                        users_on = users_on.filter((este, i) => users_on.indexOf(este) === i); //E então remove as suas repetições, caso haja
                        io.emit('users_on', users_on); //envia a array para o display na face do usuario
                        return;
                    }
                }
            }
            
        }
        console.log('Usuário inexistente')
                socket.emit('conectado_failed', "[ERROR] usuário ou senha incorreto(s)");
    });

    for(var g = 0; g < users_on.length; g++){
        if(users_on[g].estado == "off"){
            users_on.splice(g, 1);
            io.emit('users_on', users_on);
        }
    }



    socket.on('disconnect', () => {
        console.log('Um cliente se desconectou: ' + socket.id);
        acessados--;
        console.log(acessados);
        console.log(acessos);
        for(var i = 0; i < users.length; i++){ //percorre a lista de usuários
            if(users[i].id == socket.id){ //verifica se o id do usuário desconectado é igual ao id que esta sendo verificado
                console.log("Usuário "+users[i].usuario + " desconectado");
                users[i].estado = "off";
                console.log(users[i]);
                users_on.splice(i, 1);
                io.emit('users_on', users_on);
                
                console.log("users online");
                console.table(users_on);
            }
        }
    });
});



server.listen(5000, () => {
    console.log('Servidor Socket.io rodando na porta 5000');
});
