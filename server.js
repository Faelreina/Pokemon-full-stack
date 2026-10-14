import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); 


if (typeof fetch !== 'function') {
  console.log('Seu Node é antigo. Instale a versão LTS em https://nodejs.org (precisa ser 18 ou mais).');
  process.exit(1);
}

const app = express();
const PORTA = process.env.PORT || 3000;
const ARQUIVO_FAVORITOS = path.join(__dirname, 'favoritos.json');


const NOMES = [
  'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise',
  'caterpie', 'metapod', 'butterfree', 'weedle', 'kakuna', 'beedrill', 'pidgey', 'pidgeotto', 'pidgeot',
  'rattata', 'raticate', 'spearow', 'fearow', 'ekans', 'arbok', 'pikachu', 'raichu', 'sandshrew', 'sandslash',
  'nidoran-f', 'nidorina', 'nidoqueen', 'nidoran-m', 'nidorino', 'nidoking', 'clefairy', 'clefable', 'vulpix',
  'ninetales', 'jigglypuff', 'wigglytuff', 'zubat', 'golbat', 'oddish', 'gloom', 'vileplume', 'paras', 'parasect',
  'venonat', 'venomoth', 'diglett', 'dugtrio', 'meowth', 'persian', 'psyduck', 'golduck', 'mankey', 'primeape',
  'growlithe', 'arcanine', 'poliwag', 'poliwhirl', 'poliwrath', 'abra', 'kadabra', 'alakazam', 'machop', 'machoke',
  'machamp', 'bellsprout', 'weepinbell', 'victreebel', 'tentacool', 'tentacruel', 'geodude', 'graveler', 'golem',
  'ponyta', 'rapidash', 'slowpoke', 'slowbro', 'magnemite', 'magneton', 'farfetchd', 'doduo', 'dodrio', 'seel',
  'dewgong', 'grimer', 'muk', 'shellder', 'cloyster', 'gastly', 'haunter', 'gengar', 'onix', 'drowzee', 'hypno',
  'krabby', 'kingler', 'voltorb', 'electrode', 'exeggcute', 'exeggutor', 'cubone', 'marowak', 'hitmonlee',
  'hitmonchan', 'lickitung', 'koffing', 'weezing', 'rhyhorn', 'rhydon', 'chansey', 'tangela', 'kangaskhan',
  'horsea', 'seadra', 'goldeen', 'seaking', 'staryu', 'starmie', 'mr-mime', 'scyther', 'jynx', 'electabuzz',
  'magmar', 'pinsir', 'tauros', 'magikarp', 'gyarados', 'lapras', 'ditto', 'eevee', 'vaporeon', 'jolteon',
  'flareon', 'porygon', 'omanyte', 'omastar', 'kabuto', 'kabutops', 'aerodactyl', 'snorlax', 'articuno',
  'zapdos', 'moltres', 'dratini', 'dragonair', 'dragonite', 'mewtwo', 'mew'
];

const pokemons = NOMES.map(function (nome, i) {
  return { id: i + 1, name: nome };
});


app.use(express.json());


app.use(express.static(path.join(__dirname, 'public')));

function lerFavoritos() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_FAVORITOS, 'utf8'));
  } catch (erro) {
    return [];
  }
}

function salvarFavoritos(lista) {
  fs.writeFileSync(ARQUIVO_FAVORITOS, JSON.stringify(lista, null, 2));
}


app.get('/api/pokemons', function (req, res) {
  res.json(pokemons);
});


const cache = {};

app.get('/api/pokemons/:id', async function (req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1 || id > 151) {
    return res.status(404).json({ erro: 'Pokémon não encontrado.' });
  }

  if (cache[id]) {
    return res.json(cache[id]);
  }

  try {
    const resposta = await fetch('https://pokeapi.co/api/v2/pokemon/' + id);
    if (!resposta.ok) {
      throw new Error('A PokéAPI respondeu com erro ' + resposta.status);
    }
    const d = await resposta.json();

    const detalhes = {
      id: id,
      name: pokemons[id - 1].name,
      types: d.types.map(function (t) { return t.type.name; }),
      heightM: d.height / 10,  
      weightKg: d.weight / 10, 
      abilities: d.abilities.map(function (a) { return a.ability.name; })
    };

    cache[id] = detalhes;
    res.json(detalhes);
  } catch (erro) {
    console.log('Erro ao buscar detalhes:', erro.message);
    res.status(502).json({ erro: 'Não foi possível falar com a PokéAPI.' });
  }
});

// Lista de favoritos
app.get('/api/favoritos', function (req, res) {
  res.json(lerFavoritos());
});


app.post('/api/favoritos', function (req, res) {
  const id = Number(req.body.id);
  const pokemon = pokemons.find(function (p) { return p.id === id; });

  if (!pokemon) {
    return res.status(400).json({ erro: 'Pokémon inválido.' });
  }

  const lista = lerFavoritos();
  const jaExiste = lista.some(function (f) { return f.id === id; });
  if (!jaExiste) {
    lista.push(pokemon);
    salvarFavoritos(lista);
  }
  res.status(201).json(lista);
});


app.delete('/api/favoritos/:id', function (req, res) {
  const id = Number(req.params.id);
  const lista = lerFavoritos().filter(function (f) { return f.id !== id; });
  salvarFavoritos(lista);
  res.json(lista);
});



app.listen(PORTA, function () {
  console.log('Pokédex rodando! Abra no navegador: http://localhost:' + PORTA);
});
