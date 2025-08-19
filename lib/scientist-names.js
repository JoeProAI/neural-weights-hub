// Famous scientists for sandbox naming
export const FAMOUS_SCIENTISTS = [
  // Physics & Mathematics
  'Einstein', 'Newton', 'Tesla', 'Curie', 'Hawking', 'Feynman', 'Bohr', 'Heisenberg',
  'Schrödinger', 'Maxwell', 'Planck', 'Dirac', 'Pauli', 'Fermi', 'Oppenheimer',
  'Galileo', 'Kepler', 'Euler', 'Gauss', 'Riemann', 'Noether', 'Turing',
  
  // Chemistry & Biology
  'Darwin', 'Mendel', 'Watson', 'Crick', 'Franklin', 'Pasteur', 'Fleming',
  'Lavoisier', 'Mendeleev', 'Pauling', 'McClintock', 'Goodall', 'Carson',
  
  // Computer Science & AI
  'Lovelace', 'Babbage', 'vonNeumann', 'Shannon', 'McCarthy', 'Minsky',
  'Dijkstra', 'Knuth', 'Hopper', 'Berners-Lee', 'Torvalds',
  
  // Astronomy & Cosmology
  'Hubble', 'Sagan', 'Tycho', 'Copernicus', 'Brahe', 'Herschel', 'Leavitt',
  
  // Modern Scientists
  'Hinton', 'LeCun', 'Bengio', 'Ng', 'Karpathy', 'Sutskever'
];

export function getRandomScientistName() {
  const randomIndex = Math.floor(Math.random() * FAMOUS_SCIENTISTS.length);
  return FAMOUS_SCIENTISTS[randomIndex];
}

export function generateSandboxName(prefix = 'Lab') {
  const scientist = getRandomScientistName();
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
  return `${prefix}-${scientist}-${timestamp}`;
}
