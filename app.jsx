import { useState, useEffect } from 'react';
import './App.css';

const API = 'https://pokeapi.co/api/v2';


const CORES = {
  normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', electric: '#f7d02c',
  grass: '#7ac74c', ice: '#96d9d6', fighting: '#c22e28', poison: '#a33ea1',
  ground: '#e2bf65', flying: '#a98ff3', psychic: '#f95587', bug: '#a6b91a',
  rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc', dark: '#705746',
  steel: '#b7b7ce', fairy: '#d685ad',
};


function pegarImagem(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// lê os favoritos salvos no navegador
function lerFavoritos() {
  try {
    return JSON.parse(localStorage.getItem('favoritos')) || [];
  } catch (e) {
    return [];
  }
}

function Card({ pokemon, favorito, aoFavoritar, aoAbrir }) {
  return (
    <div className="card">
      <button
        className="coracao"
        aria-label={(favorito ? 'Desfavoritar ' : 'Favoritar ') + pokemon.name}
        onClick={() => aoFavoritar(pokemon)}
      >
        {favorito ? '♥' : '♡'}
      </button>
      <button
        className="card-botao"
        aria-label={'Ver detalhes de ' + pokemon.name}
        onClick={() => aoAbrir(pokemon)}
      >
        <span className="numero">Nº {String(pokemon.id).padStart(3, '0')}</span>
        <img src={pokemon.image} alt="" loading="lazy" />
        <span className="nome">{pokemon.name}</span>
      </button>
    </div>
  );
}

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState('todos'); // 'todos' ou 'favoritos'
  const [favoritos, setFavoritos] = useState(lerFavoritos);
  const [selecionado, setSelecionado] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [erroDetalhes, setErroDetalhes] = useState('');


  async function carregarPokemons() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await fetch(`${API}/pokemon?limit=151`);
      if (!resposta.ok) throw new Error('erro na resposta');
      const dados = await resposta.json();

      const lista = dados.results.map((p) => {
        const id = Number(p.url.split('/')[6]);
        return { id: id, name: p.name, image: pegarImagem(id) };
      });
      setPokemons(lista);
    } catch (e) {
      setErro('Não foi possível carregar os Pokémon. Verifique sua internet.');
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregarPokemons();
  }, []);


  useEffect(() => {
    if (!selecionado) return;

    let ativo = true;
    setDetalhes(null);
    setErroDetalhes('');

    fetch(`${API}/pokemon/${selecionado.name}`)
      .then((res) => {
        if (!res.ok) throw new Error('erro');
        return res.json();
      })
      .then((dados) => {
        if (ativo) setDetalhes(dados);
      })
      .catch(() => {
        if (ativo) setErroDetalhes('Não foi possível carregar os detalhes.');
      });

    return () => {
      ativo = false;
    };
  }, [selecionado]);

  function ehFavorito(id) {
    return favoritos.some((f) => f.id === id);
  }

  function favoritar(pokemon) {
    let novaLista;
    if (ehFavorito(pokemon.id)) {
      novaLista = favoritos.filter((f) => f.id !== pokemon.id);
    } else {
      novaLista = [...favoritos, pokemon];
    }
    setFavoritos(novaLista);
    try {
      localStorage.setItem('favoritos', JSON.stringify(novaLista));
    } catch (e) {

    }
  }

  // decide qual lista mostrar
  const lista = aba === 'todos' ? pokemons : favoritos;
  const texto = busca.trim().toLowerCase();
  const filtrados = lista.filter(
    (p) => p.name.includes(texto) || String(p.id) === texto
  );

  return (
    <div>
      <header>
        <h1>Pokédex</h1>

        <div className="abas">
          <button className={aba === 'todos' ? 'ativa' : ''} onClick={() => setAba('todos')}>
            Pokédex
          </button>
          <button className={aba === 'favoritos' ? 'ativa' : ''} onClick={() => setAba('favoritos')}>
            Favoritos ({favoritos.length})
          </button>
        </div>

        <input
          type="search"
          placeholder="Buscar por nome ou número..."
          aria-label="Buscar Pokémon"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </header>

      <main>
        {carregando && aba === 'todos' && <p className="aviso">Carregando...</p>}

        {erro && aba === 'todos' && (
          <p className="aviso erro">
            {erro} <button onClick={carregarPokemons}>Tentar novamente</button>
          </p>
        )}

        {!carregando && !erro && filtrados.length === 0 && (
          <p className="aviso">
            {aba === 'favoritos' && favoritos.length === 0
              ? 'Você ainda não tem favoritos.'
              : 'Nenhum Pokémon encontrado.'}
          </p>
        )}

        <div className="grade">
          {filtrados.map((p) => (
            <Card
              key={p.id}
              pokemon={p}
              favorito={ehFavorito(p.id)}
              aoFavoritar={favoritar}
              aoAbrir={setSelecionado}
            />
          ))}
        </div>
      </main>

      {selecionado && (
        <div className="fundo" onClick={() => setSelecionado(null)}>
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <button className="fechar" aria-label="Fechar" onClick={() => setSelecionado(null)}>
              ×
            </button>

            <h2>{selecionado.name}</h2>
            <img src={selecionado.image} alt="" />

            {!detalhes && !erroDetalhes && <p>Carregando...</p>}
            {erroDetalhes && <p className="erro">{erroDetalhes}</p>}

            {detalhes && (
              <div>
                <div className="tipos">
                  {detalhes.types.map((t) => (
                    <span key={t.type.name} className="tipo" style={{ background: CORES[t.type.name] }}>
                      {t.type.name}
                    </span>
                  ))}
                </div>
                <p>Altura: {detalhes.height / 10} m</p>
                <p>Peso: {detalhes.weight / 10} kg</p>
                <p>
                  Habilidades:{' '}
                  {detalhes.abilities.map((a) => a.ability.name.replace('-', ' ')).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
