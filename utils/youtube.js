const axios = require('axios');

const SaveTube = {
	qualities: {
		audio: { 1: '32', 2: '64', 3: '128', 4: '192' },
		video: { 1: '144', 2: '240', 3: '360', 4: '480', 5: '720', 6: '1080', 7: '1440', 8: '2160' },
	},

	headers: {
		accept: '*/*',
		referer: 'https://ytshorts.savetube.me/',
		origin: 'https://ytshorts.savetube.me/',
		'user-agent': 'Postify/1.0.0',
		'Content-Type': 'application/json',
	},

	cdnList: Array.from({ length: 11 }, (_, i) => `cdn${i + 51}.savetube.su`), // List of CDNs from cdn51.savetube.su to cdn61.savetube.su

	// Check if the given CDN is available with retry mechanism
	async isCdnAvailable(cdnUrl, retries = 3) {
		try {
			console.log(`Checking availability of CDN: ${cdnUrl}`);
			const response = await axios.get(`https://${cdnUrl}/ping`, { timeout: 5000 });
			console.log(`CDN ${cdnUrl} is available: ${response.status}`);
			return response.status === 200;
		} catch (error) {
			if (retries > 0) {
				console.log(`Retrying CDN: ${cdnUrl}, ${retries} attempts left.`);
				return this.isCdnAvailable(cdnUrl, retries - 1);
			}
			console.error(`Error checking ${cdnUrl}: ${error.message}`);
			return false; // If retries are exhausted, consider the CDN unavailable
		}
	},

	// Find an available CDN
	async findAvailableCdn() {
		for (const cdn of this.cdnList) {
			const available = await this.isCdnAvailable(cdn);
			if (available) {
				console.log(`Using CDN: ${cdn}`);
				return cdn;
			}
		}
		console.error('No available CDN found');
		throw new Error('No available CDN found');
	},

	checkQuality(type, qualityIndex) {
		if (!(qualityIndex in this.qualities[type])) {
			throw new Error(`❌ Kualitas ${type} tidak valid. Pilih salah satu: ${Object.keys(this.qualities[type]).join(', ')}`);
		}
	},

	async fetchData(url, cdn, body = {}) {
		const headers = {
			...this.headers,
			authority: cdn,
		};

		try {
			const response = await axios.post(url, body, { headers });
			return response.data;
		} catch (error) {
			console.error(`Error fetching data from ${cdn}: ${error.message}`);
			throw error;
		}
	},

	dLink(cdnUrl, type, quality, videoKey) {
		return `https://${cdnUrl}/download`;
	},

	async dl(link, qualityIndex, typeIndex) {
		const type = typeIndex === 1 ? 'audio' : 'video';
		const quality = SaveTube.qualities[type][qualityIndex];
		if (!type) throw new Error('❌ Tipe tidak valid. Pilih 1 untuk audio atau 2 untuk video.');
		SaveTube.checkQuality(type, qualityIndex);

		const cdnUrl = await SaveTube.findAvailableCdn(); // Get an available CDN

		const videoInfo = await SaveTube.fetchData(`https://${cdnUrl}/info`, cdnUrl, { url: link });
		const badi = {
			downloadType: type,
			quality: quality,
			key: videoInfo.data.key,
		};

		const dlRes = await SaveTube.fetchData(SaveTube.dLink(cdnUrl, type, quality, videoInfo.data.key), cdnUrl, badi);

		return {
			link: dlRes.data.downloadUrl,
			duration: videoInfo.data.duration,
			durationLabel: videoInfo.data.durationLabel,
			fromCache: videoInfo.data.fromCache,
			id: videoInfo.data.id,
			key: videoInfo.data.key,
			thumbnail: videoInfo.data.thumbnail,
			thumbnail_formats: videoInfo.data.thumbnail_formats,
			title: videoInfo.data.title,
			titleSlug: videoInfo.data.titleSlug,
			videoUrl: videoInfo.data.url,
			quality,
			type,
		};
	},

	async mp3(link) {
		return SaveTube.dl(link, 3, 1); // Default to 128 kbps audio
	},

	async mp4(link) {
		return SaveTube.dl(link, 5, 2); // Default to 720p video
	},
};

async function savetubemp3(url) {
	return SaveTube.mp3(url);
}

async function savetubemp4(url) {
	return SaveTube.mp4(url);
}

module.exports = { savetubemp3, savetubemp4 };