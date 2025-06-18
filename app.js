const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = 5001


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


app.use(session({
    secret: 'voleibol-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 30 * 60 * 1000, 
        secure: false
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let equipes = [];
let jogadores = [];
o
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin123') {
        req.session.authenticated = true;
        req.session.username = username;
       
        const lastAccess = req.cookies.lastAccess || 'Primeiro acesso';
        const currentTime = new Date().toLocaleString('pt-BR');
        res.cookie('lastAccess', currentTime, { maxAge: 365 * 24 * 60 * 60 * 1000 }); 
        
        req.session.lastAccess = lastAccess;
        res.redirect('/menu');
    } else {
        res.render('login', { error: 'Usuário ou senha inválidos!' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
        }
        res.redirect('/login');
    });
});

app.get('/menu', requireAuth, (req, res) => {
    res.render('menu', { 
        username: req.session.username,
        lastAccess: req.session.lastAccess 
    });
});


app.get('/equipes/cadastro', requireAuth, (req, res) => {
    res.render('equipes/cadastro', { error: null, success: null });
});

app.post('/equipes/cadastro', requireAuth, (req, res) => {
    const { nomeEquipe, nomeTecnico, telefoneTecnico } = req.body;

    const errors = [];
    
    if (!nomeEquipe || nomeEquipe.trim() === '') {
        errors.push('Nome da equipe é obrigatório');
    }
    
    if (!nomeTecnico || nomeTecnico.trim() === '') {
        errors.push('Nome do técnico é obrigatório');
    }
    
    if (!telefoneTecnico || telefoneTecnico.trim() === '') {
        errors.push('Telefone do técnico é obrigatório');
    }
    

    const equipeExistente = equipes.find(e => 
        e.nomeEquipe.toLowerCase() === nomeEquipe.trim().toLowerCase()
    );
    
    if (equipeExistente) {
        errors.push('Já existe uma equipe com este nome');
    }
    
    if (errors.length > 0) {
        return res.render('equipes/cadastro', { 
            error: errors.join(', '), 
            success: null 
        });
    }

    const novaEquipe = {
        id: equipes.length + 1,
        nomeEquipe: nomeEquipe.trim(),
        nomeTecnico: nomeTecnico.trim(),
        telefoneTecnico: telefoneTecnico.trim(),
        dataCadastro: new Date()
    };
    
    equipes.push(novaEquipe);

    res.redirect('/equipes/lista');
});

app.get('/equipes/lista', requireAuth, (req, res) => {
    res.render('equipes/lista', { equipes });
});

app.get('/jogadores/cadastro', requireAuth, (req, res) => {
    res.render('jogadores/cadastro', { 
        error: null, 
        success: null, 
        equipes: equipes 
    });
});


app.post('/jogadores/cadastro', requireAuth, (req, res) => {
    const { 
        nomeJogador, 
        numeroJogador, 
        dataNascimento, 
        altura, 
        genero, 
        posicao, 
        equipeId 
    } = req.body;
    

    const errors = [];
    
    if (!nomeJogador || nomeJogador.trim() === '') {
        errors.push('Nome do jogador é obrigatório');
    }
    
    if (!numeroJogador || numeroJogador.trim() === '') {
        errors.push('Número do jogador é obrigatório');
    }
    
    if (!dataNascimento || dataNascimento.trim() === '') {
        errors.push('Data de nascimento é obrigatória');
    }
    
    if (!altura || altura.trim() === '') {
        errors.push('Altura é obrigatória');
    }
    
    if (!genero || genero.trim() === '') {
        errors.push('Gênero é obrigatório');
    }
    
    if (!posicao || posicao.trim() === '') {
        errors.push('Posição é obrigatória');
    }
    
    if (!equipeId || equipeId.trim() === '') {
        errors.push('Equipe é obrigatória');
    }

    const equipe = equipes.find(e => e.id == equipeId);
    if (!equipe) {
        errors.push('Equipe selecionada não existe');
    }
    

    const jogadoresEquipe = jogadores.filter(j => j.equipeId == equipeId);
    if (jogadoresEquipe.length >= 6) {
        errors.push('Esta equipe já possui o máximo de 6 jogadores');
    }
    

    const numeroExistente = jogadores.find(j => 
        j.equipeId == equipeId && j.numeroJogador == numeroJogador
    );
    if (numeroExistente) {
        errors.push('Já existe um jogador com este número nesta equipe');
    }
    

    const alturaNum = parseInt(altura);
    if (isNaN(alturaNum) || alturaNum < 100 || alturaNum > 250) {
        errors.push('Altura deve ser um número entre 100 e 250 cm');
    }

    const numeroNum = parseInt(numeroJogador);
    if (isNaN(numeroNum) || numeroNum < 1 || numeroNum > 99) {
        errors.push('Número do jogador deve ser entre 1 e 99');
    }
    
    if (errors.length > 0) {
        return res.render('jogadores/cadastro', { 
            error: errors.join(', '), 
            success: null,
            equipes: equipes
        });
    }
    

    const novoJogador = {
        id: jogadores.length + 1,
        nomeJogador: nomeJogador.trim(),
        numeroJogador: parseInt(numeroJogador),
        dataNascimento: dataNascimento,
        altura: parseInt(altura),
        genero: genero,
        posicao: posicao,
        equipeId: parseInt(equipeId),
        nomeEquipe: equipe.nomeEquipe,
        dataCadastro: new Date()
    };
    
    jogadores.push(novoJogador);
    
   
    res.redirect('/jogadores/lista');
});


app.get('/jogadores/lista', requireAuth, (req, res) => {
    
    const jogadoresPorEquipe = {};
    
    equipes.forEach(equipe => {
        jogadoresPorEquipe[equipe.id] = {
            equipe: equipe,
            jogadores: jogadores.filter(j => j.equipeId === equipe.id)
        };
    });
    
    res.render('jogadores/lista', { jogadoresPorEquipe });
});


app.get('/', (req, res) => {
    res.redirect('/login');
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

module.exports = app;

