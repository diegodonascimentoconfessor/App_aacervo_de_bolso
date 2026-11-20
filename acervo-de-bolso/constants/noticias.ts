export type CategoriaNoticia = 'Filosofia' | 'Cultura' | 'Geopolítica';
export const CATEGORIAS_NOTICIA: CategoriaNoticia[] = ['Filosofia', 'Cultura', 'Geopolítica'];

export type Feed = { nome: string; url: string; categoria: CategoriaNoticia };

// Para trocar/adicionar fontes, edite só esta lista (qualquer feed RSS ou Atom, em https).
// Se um feed estiver fora do ar ou mudar de endereço, ele é ignorado e os outros continuam.
export const FEEDS: Feed[] = [
  // Geopolítica
  { nome: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/internacional/feed.xml', categoria: 'Geopolítica' },
  { nome: 'BBC Brasil', url: 'https://feeds.bbci.co.uk/portuguese/internacional/rss.xml', categoria: 'Geopolítica' },
  { nome: 'The Guardian', url: 'https://www.theguardian.com/world/rss', categoria: 'Geopolítica' },
  // Filosofia
  { nome: 'Aeon', url: 'https://aeon.co/feed.rss', categoria: 'Filosofia' },
  { nome: 'Daily Nous', url: 'https://dailynous.com/feed/', categoria: 'Filosofia' },
  { nome: 'Revista Cult', url: 'https://revistacult.uol.com.br/home/feed/', categoria: 'Filosofia' },
  // Cultura
  { nome: 'Folha Ilustrada', url: 'https://feeds.folha.uol.com.br/ilustrada/rss091.xml', categoria: 'Cultura' },
  { nome: 'G1 Pop & Arte', url: 'https://g1.globo.com/rss/g1/pop-arte/', categoria: 'Cultura' },
  { nome: 'The Guardian', url: 'https://www.theguardian.com/culture/rss', categoria: 'Cultura' },
];

export const POR_CATEGORIA = 6; // notícias de cada categoria no carrossel
export const ROTACAO_MS = 6000; // troca automática de cartão
export const ATUALIZAR_A_CADA_MS = 10 * 60 * 1000; // busca novas notícias a cada 10 min
