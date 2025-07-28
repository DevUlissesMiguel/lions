const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const { Pool } = require("pg");

// Valida se a variável de ambiente existe
if (!process.env.DATABASE_URL) {
    throw new Error("A variável de ambiente DATABASE_URL não foi definida.");
}

// Configuração de conexão com SSL para o Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Cria as tabelas se elas não existirem
const initializeDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agendamentos (id SERIAL PRIMARY KEY, nome TEXT, telefone TEXT, servico TEXT, data TEXT, horario TEXT);
            CREATE TABLE IF NOT EXISTS promocoes (id SERIAL PRIMARY KEY, titulo TEXT, descricao TEXT);
            CREATE TABLE IF NOT EXISTS dias_bloqueados (id SERIAL PRIMARY KEY, data TEXT UNIQUE);
        `);
    } catch (error) {
        console.error("Erro ao inicializar o banco de dados:", error);
    }
};
initializeDb();

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

const handle = (promise) => {
    return promise
        .then(data => ([data, undefined]))
        .catch(error => Promise.resolve([undefined, error]));
};

// --- ROTAS DA API ---
router.get("/agendamentos", async (req, res) => {
    const [result, error] = await handle(pool.query("SELECT * FROM agendamentos ORDER BY data, horario"));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: result.rows });
});

router.post("/agendamentos", async (req, res) => {
    const { nome, telefone, servico, data, horario } = req.body;
    const sql = 'INSERT INTO agendamentos (nome, telefone, servico, data, horario) VALUES ($1, $2, $3, $4, $5)';
    const [result, error] = await handle(pool.query(sql, [nome, telefone, servico, data, horario]));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Agendamento criado!" });
});

router.delete("/agendamentos/all", async (req, res) => {
    const [result, error] = await handle(pool.query('DELETE FROM agendamentos'));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Todos os agendamentos foram deletados" });
});

router.get("/promocoes", async (req, res) => {
    const [result, error] = await handle(pool.query("SELECT * FROM promocoes"));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: result.rows });
});

router.post("/promocoes", async (req, res) => {
    const { titulo, descricao } = req.body;
    const [result, error] = await handle(pool.query('INSERT INTO promocoes (titulo, descricao) VALUES ($1, $2)', [titulo, descricao]));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Promoção criada" });
});

router.delete("/promocoes/:id", async (req, res) => {
    const [result, error] = await handle(pool.query('DELETE FROM promocoes WHERE id = $1', [req.params.id]));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Deletado" });
});

router.get("/dias-bloqueados", async (req, res) => {
    const [result, error] = await handle(pool.query("SELECT data FROM dias_bloqueados"));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: result.rows.map(r => r.data) });
});

router.post("/dias-bloqueados", async (req, res) => {
    const [result, error] = await handle(pool.query('INSERT INTO dias_bloqueados (data) VALUES ($1) ON CONFLICT (data) DO NOTHING', [req.body.data]));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Dia bloqueado" });
});

router.delete("/dias-bloqueados/:data", async (req, res) => {
    const [result, error] = await handle(pool.query('DELETE FROM dias_bloqueados WHERE data = $1', [req.params.data]));
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Deletado" });
});

// A Vercel usa a pasta /api como base, então o router é montado na raiz.
app.use('/', router);

module.exports = serverless(app);