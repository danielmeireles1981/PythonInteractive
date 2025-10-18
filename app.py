# c:\Developer\Web\PythonInteractive\app.py

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

# --- Configuração da Aplicação ---
app = Flask(__name__)
# Habilita o CORS para que o frontend (rodando em um arquivo local) possa fazer requisições
CORS(app)

# Configuração do Banco de Dados SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'progress.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Modelo do Banco de Dados ---
# Define a estrutura da tabela que armazenará os dados dos jogadores
class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    avatar = db.Column(db.String(10), nullable=False, default='🐍')
    score = db.Column(db.Integer, default=0)
    unlocked_step = db.Column(db.Integer, default=1)

    def to_dict(self):
        """Converte o objeto Player para um dicionário (formato JSON)."""
        return {
            'id': self.id,
            'name': self.name,
            'avatar': self.avatar,
            'score': self.score,
            'unlocked_step': self.unlocked_step
        }

# --- Rotas da API ---

@app.route('/api/player', methods=['POST'])
def update_player():
    """
    Endpoint para criar ou atualizar o progresso de um jogador.
    Recebe dados em JSON e os salva no banco de dados.
    """
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Nome do jogador é obrigatório'}), 400

    # Procura se o jogador já existe pelo nome
    player = Player.query.filter_by(name=data['name']).first()

    if player:
        # Se o jogador existe, atualiza seus dados
        player.score = data.get('score', player.score)
        player.unlocked_step = data.get('unlocked_step', player.unlocked_step)
        player.avatar = data.get('avatar', player.avatar)
    else:
        # Se não existe, cria um novo jogador
        player = Player(
            name=data['name'],
            avatar=data.get('avatar', '🐍'),
            score=data.get('score', 0),
            unlocked_step=data.get('unlocked_step', 1)
        )
        db.session.add(player)

    db.session.commit() # Salva as alterações no banco de dados
    return jsonify(player.to_dict()), 200

@app.route('/api/player/<string:name>', methods=['GET'])
def get_player(name):
    """
    Endpoint para buscar os dados de um jogador específico pelo nome.
    """
    player = Player.query.filter_by(name=name).first()
    if player:
        return jsonify(player.to_dict())
    else:
        return jsonify({'error': 'Jogador não encontrado'}), 404

@app.route('/api/hall-of-fame', methods=['GET'])
def get_hall_of_fame():
    """
    Endpoint para buscar os melhores jogadores (Hall da Fama).
    Retorna os 10 melhores jogadores ordenados por pontuação.
    """
    top_players = Player.query.order_by(Player.score.desc()).limit(10).all()
    return jsonify([player.to_dict() for player in top_players])


# --- Inicialização ---
if __name__ == '__main__':
    with app.app_context():
        # Cria o banco de dados e a tabela se não existirem
        db.create_all()
    # Roda o servidor Flask
    app.run(debug=True, port=5000)
