// ==========================================================
// app.js - Dia 3: abas, pedido, localStorage e vibração
// ==========================================================

// ---------- Utilidades ----------

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Mostra uma mensagem rápida na parte de baixo da tela
let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = document.querySelector("#aviso");
  aviso.textContent = texto;
  aviso.classList.add("visivel");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    aviso.classList.remove("visivel");
  }, 2000);
}

// RECURSO DE HARDWARE: motor de vibração do celular
// padrao pode ser um número (ms) ou uma lista: [vibra, pausa, vibra...]
function vibrar(padrao) {
  // Nem todo aparelho tem vibração (iPhone e computador não têm esta API)
  if ("vibrate" in navigator) {
    navigator.vibrate(padrao);
  }
}

// ---------- Navegação por abas ----------

const abas = document.querySelectorAll(".aba");
const telas = document.querySelectorAll(".tela");

function abrirTela(idTela) {
  for (const tela of telas) {
    tela.hidden = tela.id !== idTela; // esconde todas, menos a escolhida
  }
  for (const aba of abas) {
    aba.classList.toggle("ativa", aba.dataset.tela === idTela);
  }
  window.scrollTo(0, 0);
}

for (const aba of abas) {
  aba.addEventListener("click", function () {
    abrirTela(aba.dataset.tela);
  });
}

// ---------- Cardápio ----------

const listaProdutos = document.querySelector("#lista-produtos");
const botoesFiltro = document.querySelectorAll(".filtro");

function criarCard(produto) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="card-emoji">${produto.emoji}</div>
    <div class="card-info">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <strong>${formatarPreco(produto.preco)}</strong>
    </div>
    <button class="btn-adicionar" aria-label="Adicionar ${produto.nome}">+</button>
  `;
  card.querySelector(".btn-adicionar").addEventListener("click", function () {
    adicionarAoPedido(produto);
  });
  return card;
}

let termoBusca = "";

function mostrarCardapio(categoria) {
  listaProdutos.innerHTML = "";
  for (const produto of produtos) {
    if ((categoria === "Todos" || produto.categoria === categoria) &&
        produto.nome.toLowerCase().includes(termoBusca)) {
      listaProdutos.appendChild(criarCard(produto));
    }
  }
}

for (const botao of botoesFiltro) {
  botao.addEventListener("click", function () {
    for (const outro of botoesFiltro) {
      outro.classList.remove("ativo");
    }
    botao.classList.add("ativo");
    mostrarCardapio(botao.dataset.categoria);
  });
}

const campoBusca = document.querySelector("#busca-produtos");
if (campoBusca) {
  campoBusca.addEventListener("input", function () {
    termoBusca = campoBusca.value.toLowerCase();
    const categoriaAtiva = document.querySelector(".filtro.ativo");
    mostrarCardapio(categoriaAtiva ? categoriaAtiva.dataset.categoria : "Todos");
  });
}

// ---------- Pedido ----------

// localStorage só guarda TEXTO. Por isso usamos JSON:
//   JSON.stringify(lista) -> transforma a lista em texto
//   JSON.parse(texto)     -> transforma o texto de volta em lista
function carregarPedido() {
  const salvo = localStorage.getItem("pedido");
  if (salvo) {
    return JSON.parse(salvo);
  }
  return []; // nada salvo ainda: pedido vazio
}

function salvarPedido() {
  localStorage.setItem("pedido", JSON.stringify(pedido));
}

// Cada item do pedido: { id, nome, preco, quantidade }
let pedido = carregarPedido();

function adicionarAoPedido(produto) {
  // Procura se o produto já está no pedido
  const item = pedido.find(function (i) {
    return i.id === produto.id;
  });

  if (item) {
    item.quantidade = item.quantidade + 1;
  } else {
    pedido.push({ id: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1 });
  }

  salvarPedido();
  mostrarPedido();
  vibrar(50); // vibração curtinha
  mostrarAviso(produto.emoji + " " + produto.nome + " adicionado");
}

// mudanca = +1 ou -1
function alterarQuantidade(id, mudanca) {
  const item = pedido.find(function (i) {
    return i.id === id;
  });
  item.quantidade = item.quantidade + mudanca;

  if (item.quantidade <= 0) {
    // filter cria uma nova lista SEM o item zerado
    pedido = pedido.filter(function (i) {
      return i.id !== id;
    });
  }
  salvarPedido();
  mostrarPedido();
}

function calcularTotal() {
  let total = 0;
  for (const item of pedido) {
    total = total + item.preco * item.quantidade;
  }
  return total;
}

function mostrarPedido() {
  const lista = document.querySelector("#lista-pedido");
  lista.innerHTML = "";

  if (pedido.length === 0) {
    lista.innerHTML = '<li class="vazio">Seu pedido está vazio. Escolha algo no cardápio!</li>';
  }

  let quantidadeTotal = 0;
  for (const item of pedido) {
    quantidadeTotal = quantidadeTotal + item.quantidade;

    const li = document.createElement("li");
    li.className = "item-pedido";
    li.innerHTML = `
      <div class="nome">
        ${item.nome}
        <small>${formatarPreco(item.preco * item.quantidade)}</small>
      </div>
      <button class="btn-qtd menos" aria-label="Diminuir">−</button>
      <span>${item.quantidade}</span>
      <button class="btn-qtd mais" aria-label="Aumentar">+</button>
    `;
    li.querySelector(".menos").addEventListener("click", function () {
      alterarQuantidade(item.id, -1);
    });
    li.querySelector(".mais").addEventListener("click", function () {
      alterarQuantidade(item.id, 1);
    });
    lista.appendChild(li);
  }

  document.querySelector("#total-pedido").textContent = formatarPreco(calcularTotal());

  // Bolinha vermelha com a quantidade, na aba "Pedido"
  const contador = document.querySelector("#contador-pedido");
  contador.textContent = quantidadeTotal;
  contador.hidden = quantidadeTotal === 0;

  document.querySelector("#btn-finalizar").disabled = pedido.length === 0;
}

const campoObservacao = document.querySelector("#observacao-pedido");

function carregarObservacao() {
  const salva = localStorage.getItem("observacaoPedido");
  if (salva && campoObservacao) {
    campoObservacao.value = salva;
  }
}

function salvarObservacao() {
  if (campoObservacao) {
    localStorage.setItem("observacaoPedido", campoObservacao.value);
  }
}

if (campoObservacao) {
  campoObservacao.addEventListener("input", salvarObservacao);
  carregarObservacao();
}

function finalizarPedido() {
  if (pedido.length === 0) {
    return;
  }
  vibrar([100, 50, 100, 50, 200]); // padrão "comemoração"
  const observacao = localStorage.getItem("observacaoPedido") || "";
  mostrarAviso("Pedido enviado! Total: " + formatarPreco(calcularTotal()) + (observacao ? " | Obs: " + observacao : ""));
  pedido = [];
  salvarPedido();
  mostrarPedido();
}

document.querySelector("#btn-finalizar").addEventListener("click", finalizarPedido);

// ---------- Início ----------
mostrarCardapio("Todos");
mostrarPedido();

// ---------- Câmera ----------

const videoCamera = document.querySelector("#camera");
const canvasFoto = document.querySelector("#canvas");
const btnFoto = document.querySelector("#btn-foto");
const btnAbrirCamera = document.querySelector("#btn-abrir-camera");
const btnLimparGaleria = document.querySelector("#btn-limpar-galeria");
const galeria = document.querySelector("#galeria");
const tituloGaleria = document.querySelector("#titulo-galeria");

function carregarFotos() {
  const salvo = localStorage.getItem("fotos");
  if (salvo) {
    try {
      return JSON.parse(salvo);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function salvarFotos() {
  localStorage.setItem("fotos", JSON.stringify(fotos));
  localStorage.setItem("galeria", JSON.stringify(fotos));
}

let fotos = carregarFotos();

async function iniciarCamera() {
  if (!videoCamera || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1080 } });
    videoCamera.srcObject = stream;
  } catch (erro) {
    mostrarAviso("Acesso à câmera negado. É necessário liberar a permissão para utilizar o recurso.");
  }
}

function mostrarGaleria() {
  if (!galeria) {
    return;
  }
  galeria.innerHTML = "";
  if (tituloGaleria) {
    tituloGaleria.textContent = `Galeria (${fotos.length})`;
  }
  for (const foto of fotos) {
    const item = document.createElement("div");
    item.className = "foto-galeria";
    item.innerHTML = `
      <img src="${foto.imagem || foto.foto || foto.dataUrl || ""}" alt="Foto">
      <p class="legenda-foto">${foto.legenda || foto.caption || ""}</p>
      <button class="btn-remover-foto">Remover</button>
    `;
    const btnRemover = item.querySelector(".btn-remover-foto");
    if (btnRemover) {
      btnRemover.addEventListener("click", function () {
        if (!confirm("Deseja apagar esta foto?")) {
          return;
        }
        fotos = fotos.filter(function (f) {
          return f !== foto;
        });
        salvarFotos();
        mostrarGaleria();
      });
    }
    galeria.appendChild(item);
  }
}

if (btnAbrirCamera) {
  btnAbrirCamera.addEventListener("click", async function () {
    if (videoCamera) {
      videoCamera.hidden = false;
    }
    if (btnFoto) {
      btnFoto.hidden = false;
    }
    if (!videoCamera.srcObject) {
      await iniciarCamera();
    }
  });
}

if (btnLimparGaleria) {
  btnLimparGaleria.addEventListener("click", function () {
    fotos = [];
    salvarFotos();
    mostrarGaleria();
    mostrarAviso("Galeria limpa");
  });
}

if (btnFoto) {
  btnFoto.addEventListener("click", async function () {
    if (!videoCamera || !canvasFoto) {
      return;
    }
    if (!videoCamera.srcObject) {
      await iniciarCamera();
    }
    if (!videoCamera.srcObject) {
      return;
    }
    if (videoCamera.readyState < 2 || !videoCamera.videoWidth) {
      await new Promise(function (resolve) {
        function pronto() {
          videoCamera.removeEventListener("loadedmetadata", pronto);
          resolve();
        }
        videoCamera.addEventListener("loadedmetadata", pronto);
        setTimeout(resolve, 1500);
      });
    }
    await new Promise(function (resolve) {
      requestAnimationFrame(resolve);
    });
    const largura = 1080;
    const escala = largura / (videoCamera.videoWidth || largura);
    canvasFoto.width = largura;
    canvasFoto.height = Math.round((videoCamera.videoHeight || largura) * escala);
    const ctx = canvasFoto.getContext("2d");
    ctx.drawImage(videoCamera, 0, 0, canvasFoto.width, canvasFoto.height);
    const imagem = canvasFoto.toDataURL("image/jpeg", 0.95);
    const legenda = prompt("Legenda da foto:");
    const foto = {
      imagem: imagem,
      legenda: legenda === null ? "" : legenda,
      data: new Date().toLocaleString()
    };
    fotos.push(foto);
    salvarFotos();
    mostrarGaleria();
    vibrar(50);
    mostrarAviso("Foto capturada");
  });
}

mostrarGaleria();

// ---------- Status de conex�o ----------
// ---------- Cafeteria mais perto (GPS) ----------
const btnCafeteriaProxima = document.querySelector("#btn-cafeteria-proxima");

if (btnCafeteriaProxima) {
  btnCafeteriaProxima.addEventListener("click", function () {
    if (!navigator.geolocation) {
      mostrarAviso("Geolocalização não suportada neste dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(function (posicao) {
      const lat = posicao.coords.latitude;
      const lon = posicao.coords.longitude;
      const url = "https://www.google.com/maps/search/cafeteria/@" + lat + "," + lon + ",15z";
      window.open(url, "_blank");
    }, function () {
      mostrarAviso("Permissão de localização negada ou indisponível.");
    });
  });
}

const faixaOffline = document.querySelector("#faixa-offline");

function atualizarStatusConexao() {
  if (faixaOffline) {
    faixaOffline.hidden = navigator.onLine;
  }
}

window.addEventListener("online", atualizarStatusConexao);
window.addEventListener("offline", atualizarStatusConexao);
atualizarStatusConexao();
