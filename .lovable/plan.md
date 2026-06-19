
# Mapa de especialistas + monitoramento 24h

## Objetivo
1. Tutor abre o app e vê no mapa os especialistas ao seu redor (com distância real).
2. Quando há uma reserva ativa (pet hospedado na casa do especialista), o tutor passa a ver, 24h por dia, a localização fixa da casa do especialista — com indicação clara de que o pet está lá.

## Fluxo do usuário

### Tela inicial (tutor sem reserva ativa)
- Mapa Google centralizado na localização atual do tutor (pede permissão do navegador; fallback para a cidade salva no perfil).
- Pins de todos os especialistas retornados por `get_especialistas_publicos` que tenham `latitude/longitude`.
- Cada pin clicável abre um card: foto, nome, especialidades, preço/diária, distância em km e botão "Reservar".
- Lista lateral/inferior ordenada por distância (mais próximos primeiro).

### Tela inicial (tutor com reserva ativa)
- Banner no topo: "Seu pet está com {nome do especialista}".
- Mapa entra em **modo estadia**: centralizado na casa do especialista, com um único pin destacado (ícone de casa + avatar) e raio visual ao redor.
- Card fixo: nome do especialista, endereço aproximado, duração da estadia, botões "Mensagem" e "Ver detalhes".
- Disponível 24/7 enquanto `bookings.status` for `confirmada`/`em_andamento` e `now()` estiver entre `data_inicio` e `data_fim`.

## Mudanças técnicas

### Backend
- Nova RPC `get_reserva_ativa_tutor()` (SECURITY DEFINER) que retorna, para o `auth.uid()` atual, a reserva ativa + dados públicos do especialista (nome, avatar, latitude, longitude, data_inicio, data_fim). Evita query direta com join restrito pela RLS.
- Sem mudanças de schema; reutiliza `bookings` e `perfis`.

### Frontend
- `src/components/specialists-map.tsx`: aceitar prop `mode: "discovery" | "stay"`; no modo stay renderiza um único marcador estilizado (casa) e ignora a lista.
- `src/routes/index.tsx`:
  - Geolocalização do navegador (`navigator.geolocation`) com fallback.
  - Calcular distância (Haversine) e ordenar especialistas.
  - Consultar `get_reserva_ativa_tutor`; se houver reserva ativa, trocar o mapa para modo stay e mostrar o banner/card.
- `src/routes/monitoramento.tsx`: mesma lógica de "casa do especialista" quando há reserva ativa, substituindo o estado vazio atual.

### Google Maps
- Continuar usando a chave de browser já conectada (`VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`), `google.maps.Marker` (sem `mapId`), `loading=async` + callback.

## Fora de escopo
- Tracking GPS em tempo real do pet (não há hardware/coleira). O "24h" significa visibilidade contínua da casa do especialista, não rastreamento ao vivo.
- Edição de localização do especialista (já existente no perfil).
