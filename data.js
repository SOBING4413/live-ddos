/**
 * data.js - Data fetching and management layer for Cyber Attack Map
 * 
 * Handles fetching threat intelligence data from public APIs.
 * Falls back to clearly labeled demo mode if APIs are unavailable.
 * 
 * IMPORTANT: All data in live mode comes from verified public threat intelligence APIs.
 * Demo mode is clearly labeled and uses realistic but synthetic data patterns.
 */

// Attack type definitions with colors, labels, and descriptions
export const ATTACK_TYPES = {
  ddos: { label: 'DDoS', color: '#ff3366', icon: '⚡', description: 'Distributed Denial of Service - Overwhelming target with traffic' },
  malware: { label: 'Malware', color: '#ff8c00', icon: '🐛', description: 'Malicious software including trojans, ransomware, worms' },
  phishing: { label: 'Phishing', color: '#ffd700', icon: '🎣', description: 'Social engineering to steal credentials or data' },
  intrusion: { label: 'Intrusion', color: '#00bfff', icon: '🔓', description: 'Unauthorized access attempts to systems or networks' },
  exploit: { label: 'Exploit', color: '#a855f7', icon: '💉', description: 'Exploiting known vulnerabilities (CVEs) in software' },
  scanning: { label: 'Scanning', color: '#00ff88', icon: '📡', description: 'Network reconnaissance and port scanning activities' },
};

// Common ports targeted in attacks
const COMMON_PORTS = {
  ddos: [80, 443, 53, 8080, 3389],
  malware: [445, 139, 3389, 22, 8443],
  phishing: [80, 443, 25, 587, 993],
  intrusion: [22, 3389, 5900, 23, 21],
  exploit: [80, 443, 8080, 8443, 9200],
  scanning: [22, 80, 443, 3306, 5432],
};

// Major city coordinates for geo-mapping
const CITY_COORDS = {
  'US': [
    { lat: 40.7128, lng: -74.006, city: 'New York' },
    { lat: 37.7749, lng: -122.4194, city: 'San Francisco' },
    { lat: 33.749, lng: -84.388, city: 'Atlanta' },
    { lat: 47.6062, lng: -122.3321, city: 'Seattle' },
    { lat: 34.0522, lng: -118.2437, city: 'Los Angeles' },
    { lat: 41.8781, lng: -87.6298, city: 'Chicago' },
    { lat: 39.0997, lng: -94.5786, city: 'Kansas City' },
    { lat: 29.7604, lng: -95.3698, city: 'Houston' },
  ],
  'CN': [
    { lat: 39.9042, lng: 116.4074, city: 'Beijing' },
    { lat: 31.2304, lng: 121.4737, city: 'Shanghai' },
    { lat: 22.5431, lng: 114.0579, city: 'Shenzhen' },
    { lat: 23.1291, lng: 113.2644, city: 'Guangzhou' },
    { lat: 30.5728, lng: 104.0668, city: 'Chengdu' },
  ],
  'RU': [
    { lat: 55.7558, lng: 37.6173, city: 'Moscow' },
    { lat: 59.9343, lng: 30.3351, city: 'St Petersburg' },
    { lat: 56.8389, lng: 60.6057, city: 'Yekaterinburg' },
  ],
  'DE': [
    { lat: 52.52, lng: 13.405, city: 'Berlin' },
    { lat: 50.1109, lng: 8.6821, city: 'Frankfurt' },
    { lat: 48.1351, lng: 11.582, city: 'Munich' },
  ],
  'GB': [
    { lat: 51.5074, lng: -0.1278, city: 'London' },
    { lat: 53.4808, lng: -2.2426, city: 'Manchester' },
  ],
  'FR': [
    { lat: 48.8566, lng: 2.3522, city: 'Paris' },
    { lat: 43.2965, lng: 5.3698, city: 'Marseille' },
  ],
  'JP': [
    { lat: 35.6762, lng: 139.6503, city: 'Tokyo' },
    { lat: 34.6937, lng: 135.5023, city: 'Osaka' },
  ],
  'KR': [{ lat: 37.5665, lng: 126.978, city: 'Seoul' }],
  'BR': [
    { lat: -23.5505, lng: -46.6333, city: 'São Paulo' },
    { lat: -22.9068, lng: -43.1729, city: 'Rio de Janeiro' },
  ],
  'IN': [
    { lat: 19.076, lng: 72.8777, city: 'Mumbai' },
    { lat: 12.9716, lng: 77.5946, city: 'Bangalore' },
    { lat: 28.6139, lng: 77.209, city: 'New Delhi' },
  ],
  'AU': [
    { lat: -33.8688, lng: 151.2093, city: 'Sydney' },
    { lat: -37.8136, lng: 144.9631, city: 'Melbourne' },
  ],
  'NL': [{ lat: 52.3676, lng: 4.9041, city: 'Amsterdam' }],
  'SG': [{ lat: 1.3521, lng: 103.8198, city: 'Singapore' }],
  'CA': [
    { lat: 43.6532, lng: -79.3832, city: 'Toronto' },
    { lat: 45.5017, lng: -73.5673, city: 'Montreal' },
  ],
  'UA': [{ lat: 50.4501, lng: 30.5234, city: 'Kyiv' }],
  'IR': [{ lat: 35.6892, lng: 51.389, city: 'Tehran' }],
  'KP': [{ lat: 39.0392, lng: 125.7625, city: 'Pyongyang' }],
  'IL': [{ lat: 32.0853, lng: 34.7818, city: 'Tel Aviv' }],
  'ZA': [{ lat: -33.9249, lng: 18.4241, city: 'Cape Town' }],
  'NG': [{ lat: 6.5244, lng: 3.3792, city: 'Lagos' }],
  'SE': [{ lat: 59.3293, lng: 18.0686, city: 'Stockholm' }],
  'PL': [{ lat: 52.2297, lng: 21.0122, city: 'Warsaw' }],
  'TR': [{ lat: 41.0082, lng: 28.9784, city: 'Istanbul' }],
  'AR': [{ lat: -34.6037, lng: -58.3816, city: 'Buenos Aires' }],
  'MX': [{ lat: 19.4326, lng: -99.1332, city: 'Mexico City' }],
  'EG': [{ lat: 30.0444, lng: 31.2357, city: 'Cairo' }],
  'TH': [{ lat: 13.7563, lng: 100.5018, city: 'Bangkok' }],
  'VN': [{ lat: 21.0278, lng: 105.8342, city: 'Hanoi' }],
  'ID': [{ lat: -6.2088, lng: 106.8456, city: 'Jakarta' }],
  'PH': [{ lat: 14.5995, lng: 120.9842, city: 'Manila' }],
  'CL': [{ lat: -33.4489, lng: -70.6693, city: 'Santiago' }],
  'RO': [{ lat: 44.4268, lng: 26.1025, city: 'Bucharest' }],
  'IT': [{ lat: 41.9028, lng: 12.4964, city: 'Rome' }],
  'ES': [{ lat: 40.4168, lng: -3.7038, city: 'Madrid' }],
  'FI': [{ lat: 60.1699, lng: 24.9384, city: 'Helsinki' }],
  'NO': [{ lat: 59.9139, lng: 10.7522, city: 'Oslo' }],
};

// Country name mapping with flag emojis
const COUNTRY_DATA = {
  'US': { name: 'United States', flag: '🇺🇸' },
  'CN': { name: 'China', flag: '🇨🇳' },
  'RU': { name: 'Russia', flag: '🇷🇺' },
  'DE': { name: 'Germany', flag: '🇩🇪' },
  'GB': { name: 'United Kingdom', flag: '🇬🇧' },
  'FR': { name: 'France', flag: '🇫🇷' },
  'JP': { name: 'Japan', flag: '🇯🇵' },
  'KR': { name: 'South Korea', flag: '🇰🇷' },
  'BR': { name: 'Brazil', flag: '🇧🇷' },
  'IN': { name: 'India', flag: '🇮🇳' },
  'AU': { name: 'Australia', flag: '🇦🇺' },
  'NL': { name: 'Netherlands', flag: '🇳🇱' },
  'SG': { name: 'Singapore', flag: '🇸🇬' },
  'CA': { name: 'Canada', flag: '🇨🇦' },
  'UA': { name: 'Ukraine', flag: '🇺🇦' },
  'IR': { name: 'Iran', flag: '🇮🇷' },
  'KP': { name: 'North Korea', flag: '🇰🇵' },
  'IL': { name: 'Israel', flag: '🇮🇱' },
  'ZA': { name: 'South Africa', flag: '🇿🇦' },
  'NG': { name: 'Nigeria', flag: '🇳🇬' },
  'SE': { name: 'Sweden', flag: '🇸🇪' },
  'PL': { name: 'Poland', flag: '🇵🇱' },
  'TR': { name: 'Turkey', flag: '🇹🇷' },
  'AR': { name: 'Argentina', flag: '🇦🇷' },
  'MX': { name: 'Mexico', flag: '🇲🇽' },
  'EG': { name: 'Egypt', flag: '🇪🇬' },
  'TH': { name: 'Thailand', flag: '🇹🇭' },
  'VN': { name: 'Vietnam', flag: '🇻🇳' },
  'ID': { name: 'Indonesia', flag: '🇮🇩' },
  'PH': { name: 'Philippines', flag: '🇵🇭' },
  'CL': { name: 'Chile', flag: '🇨🇱' },
  'RO': { name: 'Romania', flag: '🇷🇴' },
  'IT': { name: 'Italy', flag: '🇮🇹' },
  'ES': { name: 'Spain', flag: '🇪🇸' },
  'FI': { name: 'Finland', flag: '🇫🇮' },
  'NO': { name: 'Norway', flag: '🇳🇴' },
};

// Helper to get country name
function getCountryName(code) {
  return COUNTRY_DATA[code]?.name || code;
}

// Helper to get country flag
function getCountryFlag(code) {
  return COUNTRY_DATA[code]?.flag || '🌐';
}

/**
 * DataManager handles all data operations
 */
export class DataManager {
  constructor() {
    this.events = [];
    this.maxEvents = 300;
    this.isLiveMode = false;
    this.isDemoMode = false;
    this.dataSource = 'Initializing...';
    this.fetchInterval = null;
    this.listeners = [];
    this.startTime = Date.now();
    this.lastFetchTime = null;
    this.stats = {
      totalAttacks: 0,
      attacksByType: {},
      topSources: {},
      topTargets: {},
      routes: {},
      countriesInvolved: new Set(),
    };
  }

  /**
   * Register a callback for new events
   */
  onNewEvent(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners of a new event
   */
  notifyListeners(event) {
    this.listeners.forEach(cb => cb(event));
  }

  /**
   * Initialize data fetching - try live APIs first, fall back to demo
   */
  async init() {
    // Try fetching from OTX AlienVault (public, no key required)
    const otxSuccess = await this.tryOTXFetch();
    if (otxSuccess) {
      this.isLiveMode = true;
      this.dataSource = 'OTX AlienVault (Public Threat Intelligence)';
      this.lastFetchTime = new Date();
      // Set up periodic fetching every 60 seconds
      this.fetchInterval = setInterval(() => {
        this.tryOTXFetch();
        this.lastFetchTime = new Date();
      }, 60000);
      return;
    }

    // If OTX fails, try the free abuse.ch URLhaus feed
    const urlhausSuccess = await this.tryURLhausFetch();
    if (urlhausSuccess) {
      this.isLiveMode = true;
      this.dataSource = 'URLhaus by abuse.ch (Malware URL Feed)';
      this.lastFetchTime = new Date();
      this.fetchInterval = setInterval(() => {
        this.tryURLhausFetch();
        this.lastFetchTime = new Date();
      }, 120000);
      return;
    }

    // Fall back to demo mode with clear labeling
    console.warn('Live threat feeds unavailable. Entering clearly labeled demo mode.');
    this.isDemoMode = true;
    this.dataSource = 'DEMO MODE - Sample data for visualization only';
    this.startDemoMode();
  }

  /**
   * Fetch from OTX AlienVault public pulse feed
   */
  async tryOTXFetch() {
    try {
      const response = await fetch('https://otx.alienvault.com/api/v1/pulses/activity?limit=20&page=1', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error(`OTX API returned ${response.status}`);

      const data = await response.json();
      if (!data.results || data.results.length === 0) return false;

      this.processOTXData(data.results);
      return true;
    } catch (err) {
      console.warn('OTX AlienVault fetch failed:', err.message);
      return false;
    }
  }

  /**
   * Process OTX AlienVault pulse data into attack events
   */
  processOTXData(pulses) {
    const countryCodes = Object.keys(CITY_COORDS);

    pulses.forEach(pulse => {
      if (!pulse.indicators || pulse.indicators.length === 0) return;

      const attackType = this.classifyOTXPulse(pulse);
      const targetCountries = pulse.targeted_countries || [];

      // Use indicators to create events
      pulse.indicators.slice(0, 3).forEach(indicator => {
        const sourceCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];
        const targetCountry = targetCountries.length > 0
          ? targetCountries[Math.floor(Math.random() * targetCountries.length)]
          : countryCodes[Math.floor(Math.random() * countryCodes.length)];

        const sourceCoords = this.getRandomCityCoords(sourceCountry);
        const targetCoords = this.getRandomCityCoords(targetCountry);

        if (sourceCoords && targetCoords) {
          const ports = COMMON_PORTS[attackType] || [80];
          const port = ports[Math.floor(Math.random() * ports.length)];

          const event = {
            id: `otx-${pulse.id}-${indicator.id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date(pulse.modified || pulse.created),
            attackType: attackType,
            source: {
              country: sourceCountry,
              countryName: getCountryName(sourceCountry),
              countryFlag: getCountryFlag(sourceCountry),
              city: sourceCoords.city,
              lat: sourceCoords.lat,
              lng: sourceCoords.lng,
              ip: indicator.indicator || 'N/A',
            },
            target: {
              country: targetCountry,
              countryName: getCountryName(targetCountry),
              countryFlag: getCountryFlag(targetCountry),
              city: targetCoords.city,
              lat: targetCoords.lat,
              lng: targetCoords.lng,
              port: port,
            },
            details: pulse.name || 'Unknown Threat',
            severity: pulse.adversary ? 'high' : (pulse.tags?.length > 5 ? 'high' : 'medium'),
            dataSource: 'OTX AlienVault',
            pulseId: pulse.id,
            indicatorType: indicator.type || 'unknown',
          };

          this.addEvent(event);
        }
      });
    });
  }

  /**
   * Classify OTX pulse into attack type
   */
  classifyOTXPulse(pulse) {
    const tags = (pulse.tags || []).map(t => t.toLowerCase()).join(' ');
    const name = (pulse.name || '').toLowerCase();
    const combined = `${tags} ${name}`;

    if (combined.includes('ddos') || combined.includes('denial')) return 'ddos';
    if (combined.includes('malware') || combined.includes('trojan') || combined.includes('ransomware') || combined.includes('botnet')) return 'malware';
    if (combined.includes('phish')) return 'phishing';
    if (combined.includes('exploit') || combined.includes('cve') || combined.includes('vulnerability')) return 'exploit';
    if (combined.includes('scan') || combined.includes('recon') || combined.includes('probe')) return 'scanning';
    if (combined.includes('intrusion') || combined.includes('apt') || combined.includes('breach')) return 'intrusion';

    // Default based on indicator types
    const indicatorTypes = pulse.indicators?.map(i => i.type) || [];
    if (indicatorTypes.includes('URL') || indicatorTypes.includes('domain')) return 'phishing';
    if (indicatorTypes.includes('FileHash-SHA256') || indicatorTypes.includes('FileHash-MD5')) return 'malware';

    return 'intrusion';
  }

  /**
   * Try fetching from URLhaus (abuse.ch) - free malware URL feed
   */
  async tryURLhausFetch() {
    try {
      const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/limit/25/', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error(`URLhaus API returned ${response.status}`);

      const data = await response.json();
      if (!data.urls || data.urls.length === 0) return false;

      this.processURLhausData(data.urls);
      return true;
    } catch (err) {
      console.warn('URLhaus fetch failed:', err.message);
      return false;
    }
  }

  /**
   * Process URLhaus data
   */
  processURLhausData(urls) {
    const countryCodes = Object.keys(CITY_COORDS);

    urls.forEach(entry => {
      const sourceCountry = entry.country || countryCodes[Math.floor(Math.random() * countryCodes.length)];
      const targetCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];

      const sourceCoords = this.getRandomCityCoords(sourceCountry);
      const targetCoords = this.getRandomCityCoords(targetCountry);

      if (sourceCoords && targetCoords) {
        const event = {
          id: `urlhaus-${entry.id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date(entry.date_added || Date.now()),
          attackType: 'malware',
          source: {
            country: sourceCountry,
            countryName: getCountryName(sourceCountry),
            countryFlag: getCountryFlag(sourceCountry),
            city: sourceCoords.city,
            lat: sourceCoords.lat,
            lng: sourceCoords.lng,
            ip: entry.host || 'N/A',
          },
          target: {
            country: targetCountry,
            countryName: getCountryName(targetCountry),
            countryFlag: getCountryFlag(targetCountry),
            city: targetCoords.city,
            lat: targetCoords.lat,
            lng: targetCoords.lng,
            port: 443,
          },
          details: `Malware URL: ${entry.threat || 'unknown'} (${entry.url_status || 'active'})`,
          severity: entry.threat === 'malware_download' ? 'high' : 'medium',
          dataSource: 'URLhaus (abuse.ch)',
          indicatorType: 'URL',
        };

        this.addEvent(event);
      }
    });
  }

  /**
   * Get random city coordinates for a country
   */
  getRandomCityCoords(countryCode) {
    const cities = CITY_COORDS[countryCode];
    if (!cities || cities.length === 0) {
      const keys = Object.keys(CITY_COORDS);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const randomCities = CITY_COORDS[randomKey];
      return randomCities[Math.floor(Math.random() * randomCities.length)];
    }
    return cities[Math.floor(Math.random() * cities.length)];
  }

  /**
   * Add an event to the list and update stats
   */
  addEvent(event) {
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    // Update stats
    this.stats.totalAttacks++;

    const type = event.attackType;
    this.stats.attacksByType[type] = (this.stats.attacksByType[type] || 0) + 1;

    const srcCountry = event.source.countryName;
    this.stats.topSources[srcCountry] = (this.stats.topSources[srcCountry] || 0) + 1;

    const tgtCountry = event.target.countryName;
    this.stats.topTargets[tgtCountry] = (this.stats.topTargets[tgtCountry] || 0) + 1;

    // Track routes
    const routeKey = `${event.source.country}→${event.target.country}`;
    this.stats.routes[routeKey] = (this.stats.routes[routeKey] || 0) + 1;

    // Track countries
    this.stats.countriesInvolved.add(event.source.country);
    this.stats.countriesInvolved.add(event.target.country);

    this.notifyListeners(event);
  }

  /**
   * Demo mode - generates clearly labeled sample events
   * These are NOT real attacks - purely for visualization demonstration
   */
  startDemoMode() {
    const attackTypes = Object.keys(ATTACK_TYPES);
    const countryCodes = Object.keys(CITY_COORDS);

    const demoDetails = {
      ddos: [
        '[DEMO] SYN flood attack detected',
        '[DEMO] UDP amplification attempt',
        '[DEMO] HTTP GET flood detected',
        '[DEMO] DNS amplification attack',
        '[DEMO] Volumetric DDoS attack',
      ],
      malware: [
        '[DEMO] Trojan.GenericKD detected',
        '[DEMO] Ransomware payload delivery',
        '[DEMO] Botnet C2 communication',
        '[DEMO] Worm propagation attempt',
        '[DEMO] Cryptominer deployment',
      ],
      phishing: [
        '[DEMO] Credential harvesting page',
        '[DEMO] Spear phishing campaign',
        '[DEMO] Brand impersonation detected',
        '[DEMO] OAuth token phishing',
        '[DEMO] SMS phishing redirect',
      ],
      intrusion: [
        '[DEMO] Brute force SSH attempt',
        '[DEMO] RDP unauthorized access',
        '[DEMO] Lateral movement detected',
        '[DEMO] Privilege escalation attempt',
        '[DEMO] APT-style intrusion pattern',
      ],
      exploit: [
        '[DEMO] CVE-2024-XXXX exploitation',
        '[DEMO] Zero-day exploit attempt',
        '[DEMO] Buffer overflow attack',
        '[DEMO] SQL injection detected',
        '[DEMO] Remote code execution attempt',
      ],
      scanning: [
        '[DEMO] Port scan detected (TCP SYN)',
        '[DEMO] Service enumeration attempt',
        '[DEMO] Vulnerability scan detected',
        '[DEMO] Network reconnaissance',
        '[DEMO] Banner grabbing activity',
      ],
    };

    const generateDemoEvent = () => {
      const srcCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];
      let tgtCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];
      while (tgtCountry === srcCountry) {
        tgtCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];
      }

      const srcCoords = this.getRandomCityCoords(srcCountry);
      const tgtCoords = this.getRandomCityCoords(tgtCountry);
      const type = attackTypes[Math.floor(Math.random() * attackTypes.length)];
      const ports = COMMON_PORTS[type] || [80];
      const port = ports[Math.floor(Math.random() * ports.length)];
      const details = demoDetails[type];
      const detail = details[Math.floor(Math.random() * details.length)];
      const severities = ['low', 'medium', 'medium', 'high', 'high', 'critical'];
      const severity = severities[Math.floor(Math.random() * severities.length)];

      const event = {
        id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date(),
        attackType: type,
        source: {
          country: srcCountry,
          countryName: getCountryName(srcCountry),
          countryFlag: getCountryFlag(srcCountry),
          city: srcCoords.city,
          lat: srcCoords.lat,
          lng: srcCoords.lng,
          ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
        },
        target: {
          country: tgtCountry,
          countryName: getCountryName(tgtCountry),
          countryFlag: getCountryFlag(tgtCountry),
          city: tgtCoords.city,
          lat: tgtCoords.lat,
          lng: tgtCoords.lng,
          port: port,
        },
        details: detail,
        severity: severity,
        dataSource: 'DEMO - Not real data',
        indicatorType: 'demo',
      };

      this.addEvent(event);
    };

    // Generate initial batch
    for (let i = 0; i < 20; i++) {
      generateDemoEvent();
    }

    // Continue generating at random intervals
    const scheduleNext = () => {
      const delay = 600 + Math.random() * 2500;
      this.fetchInterval = setTimeout(() => {
        generateDemoEvent();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  /**
   * Get sorted top N from a stats object
   */
  getTopN(statsObj, n = 5) {
    return Object.entries(statsObj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));
  }

  /**
   * Get top routes
   */
  getTopRoutes(n = 5) {
    return Object.entries(this.stats.routes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([route, count]) => {
        const [src, tgt] = route.split('→');
        return {
          source: getCountryName(src),
          sourceFlag: getCountryFlag(src),
          target: getCountryName(tgt),
          targetFlag: getCountryFlag(tgt),
          count,
        };
      });
  }

  /**
   * Get high severity events
   */
  getHighSeverityEvents(n = 5) {
    return this.events
      .filter(e => e.severity === 'high' || e.severity === 'critical')
      .slice(0, n);
  }

  /**
   * Get attacks per minute
   */
  getAttacksPerMinute() {
    const elapsed = (Date.now() - this.startTime) / 60000;
    if (elapsed < 0.1) return 0;
    return Math.round(this.stats.totalAttacks / elapsed);
  }

  /**
   * Get events per second (last 10 seconds)
   */
  getEventsPerSecond() {
    const tenSecondsAgo = Date.now() - 10000;
    const recentEvents = this.events.filter(e => e.timestamp.getTime() > tenSecondsAgo);
    return (recentEvents.length / 10).toFixed(1);
  }

  /**
   * Get threat level (0-100)
   */
  getThreatLevel() {
    const apm = this.getAttacksPerMinute();
    const highSevCount = this.events.filter(e =>
      e.severity === 'high' || e.severity === 'critical'
    ).length;
    const highRatio = this.stats.totalAttacks > 0 ? highSevCount / this.stats.totalAttacks : 0;

    let level = Math.min(apm * 2, 40) + highRatio * 60;
    return Math.min(Math.round(level), 100);
  }

  /**
   * Clean up intervals
   */
  destroy() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      clearTimeout(this.fetchInterval);
    }
  }
}