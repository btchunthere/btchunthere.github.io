const canvas = document.getElementById('matrix');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const fontSize = 16;
const columns = canvas.width / fontSize;

const drops = Array.from({ length: columns }).fill(1);

const drawMatrix = () => {
  context.fillStyle = 'rgba(0, 0, 0, 0.05)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#0f0';
  context.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = Math.random() > 0.5 ? '1' : '0';
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    context.fillText(text, x, y);

    if (y > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
};

setInterval(drawMatrix, 50);

const showPrivateKey = (key, addresses) => {
  document.getElementById('privateKey').innerText = key;
  document.getElementById('privateKey').classList.remove('blinking');
  document.getElementById('compressedAddress').innerText = addresses.compressed;
  document.getElementById('uncompressedAddress').innerText = addresses.uncompressed;
  document.getElementById('bech32Address').innerText = addresses.bech32;
  document.getElementById('compressedAddress').classList.remove('blinking');
  document.getElementById('uncompressedAddress').classList.remove('blinking');
  document.getElementById('bech32Address').classList.remove('blinking');
};

const resetBalances = () => {
  document.getElementById('compressedBalance').innerText = '... BTC';
  document.getElementById('uncompressedBalance').innerText = '... BTC';
  document.getElementById('bech32Balance').innerText = '... BTC';
};

const updateBalance = (type, balance) => {
  document.getElementById(`${type}Balance`).innerText =
    balance > 0 ? `${balance} BTC` : '0 BTC';
};

const checkBalance = async (address, type) => {
    const response = await fetch(`https://blockchain.info/q/addressbalance/${address}?cors=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (response.ok) {
      const balance = parseInt(await response.text()) / 1e8;
      updateBalance(type, balance);
      return balance;
    }
    return 0;
  };
  

const generateKey = () => {
  const keyPair = bitcoinjs.ECPair.makeRandom();
  const { address: compressedAddress } = bitcoinjs.payments.p2pkh({
    pubkey: keyPair.publicKey,
  });
  const uncompressedKeyPair = bitcoinjs.ECPair.fromPrivateKey(
    keyPair.privateKey,
    { compressed: false }
  );
  const { address: uncompressedAddress } = bitcoinjs.payments.p2pkh({
    pubkey: uncompressedKeyPair.publicKey,
  });
  const { address: bech32Address } = bitcoinjs.payments.p2wpkh({
    pubkey: keyPair.publicKey,
  });

  const addresses = {
    compressed: compressedAddress,
    uncompressed: uncompressedAddress,
    bech32: bech32Address,
  };

  showPrivateKey(keyPair.toWIF(), addresses);
  resetBalances();

  const checkAllBalances = async () => {
    const compressedBalance = await checkBalance(compressedAddress, 'compressed');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay

    const uncompressedBalance = await checkBalance(uncompressedAddress, 'uncompressed');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay

    const bech32Balance = await checkBalance(bech32Address, 'bech32');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay

    if (compressedBalance > 0 || uncompressedBalance > 0 || bech32Balance > 0) {
      setTimeout(() => {
        generateKey();
      }, 20000);
    } else {
      setTimeout(generateKey, 2000); // 2 seconds delay before generating new key
    }
  };

  setTimeout(checkAllBalances, 1000); // Initial delay before checking balances
};

generateKey();
