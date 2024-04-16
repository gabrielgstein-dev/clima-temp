export interface PrevisaoResponse {
  geocode: number;
  nome: string;
  capital: boolean;
  cor: string;
  centroide: string;
  poligono?: string; // Opcional, pois vamos removê-lo
  resumo: string;
  data_previsao: string;
  turno: string;
  temperatura_maxima: number;
  temperatura_minima: number;
  icone: string;
}
