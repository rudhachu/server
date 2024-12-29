const axios = require('axios');
const cheerio = require('cheerio');

async function stickersearch(query) {
	return new Promise(resolve => {
		axios.get(`https://getstickerpack.com/stickers?query=${query}`).then(
			({ data }) => {
				const $ = cheerio.load(data);
				const link = [];
				$('#stickerPacks > div > div:nth-child(3) > div > a').each(
					function (a, b) {
						link.push($(b).attr('href'));
					},
				);
				let rand = link[Math.floor(Math.random() * link.length)];
				axios.get(rand).then(({ data }) => {
					const $$ = cheerio.load(data);
					const url = [];
					$$('#stickerPack > div > div.row > div > img').each(
						function (a, b) {
							url.push($$(b).attr('src').split('&d=')[0]);
						},
					);
					resolve({
						creator: 'Astro',
						title: $$('#intro > div > div > h1').text(),
						author: $$('#intro > div > div > h5 > a').text(),
						author_link: $$(
							'#intro > div > div > h5 > a',
						).attr('href'),
						sticker: url,
					});
				});
			},
		);
	});
}

async function Google(query) {
	const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
		query,
	)}`;

	try {
		const response = await axios.get(searchUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
			},
		});

		const $ = cheerio.load(response.data);
		const results = [];

		$('div.g').each((_, element) => {
			const title = $(element).find('h3').text();
			const link = $(element).find('a').attr('href');
			const description = $(element).find('div.VwiC3b').text();

			if (title && link) {
				results.push(
					`Title: ${title}\nLink: ${link}\nDescription: ${description}\n`,
				);
			}
		});

		return results.join('\n');
	} catch (error) {
		throw new Error(`Failed to scrape Google: ${error.message}`);
	}
}

function wallpaper(title, page = 1) {
	return new Promise((resolve, reject) => {
		axios.get(
			`https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${title}`,
		).then(({ data }) => {
			let $ = cheerio.load(data);
			let hasil = [];
			$('div.grid-item').each(function (a, b) {
				hasil.push({
					type: $(b).find('div.info > a:nth-child(2)').text(),
					image: $(b).find('img').attr('src'),
				});
			});
			resolve(hasil);
		});
	});
}

async function wikipedia(query) {
	const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
		query,
	)}&limit=1&format=json`;
	const searchResponse = await axios.get(searchUrl);

	if (searchResponse.data[1].length === 0) {
		return null;
	}

	const articleTitle = searchResponse.data[1][0];
	const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(
		articleTitle.replace(/ /g, '_'),
	)}`;
	const pageResponse = await axios.get(articleUrl);

	const $ = cheerio.load(pageResponse.data);
	const paragraphs = $('#mw-content-text p')
		.not('.mw-empty-elt')
		.slice(0, 3)
		.map((_, element) => $(element).text())
		.get();

	return {
		title: articleTitle,
		url: articleUrl,
		extract: paragraphs.join('\n\n'),
	};
}

async function mediafire(url) {
	let query = await axios.get(url);
	let cher = cheerio.load(query.data);
	let hasil = [];
	let link = cher('a#downloadButton').attr('href');
	let size = cher('a#downloadButton')
		.text()
		.replace('Download', '')
		.replace('(', '')
		.replace(')', '')
		.replace('\n', '')
		.replace('\n', '')
		.replace(' ', '');
	let seplit = link.split('/');
	let author = 'Xasena';
	let nama = seplit[5];
	let mime = nama.split('.');
	mime = mime[1];
	hasil.push({ author, nama, mime, size, link });
	return hasil;
}

async function Bing(query) {
	try {
		const response = await axios.get(
			'https://www.bing.com/search?q=' + encodeURIComponent(query),
			{
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				},
			},
		);
		const $ = cheerio.load(response.data);

		const results = [];
		$('#b_results > li.b_algo').each((i, element) => {
			if (i < 10) {
				const titleElement = $(element).find('h2 a');
				const description = $(element)
					.find('.b_caption p')
					.first()
					.text()
					.trim();

				results.push({
					title: titleElement.text().trim(),
					description: description,
					link: titleElement.attr('href'),
				});
			}
		});

		return results;
	} catch (error) {
		console.error('Error searching Bing:', error);
		return [];
	}
}

async function GizChinaNews() {
	const url = 'https://www.gizchina.com/category/news/';
	try {
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);

		const articles = [];

		$('.vw-post-box').each((i, el) => {
			const title = $(el).find('.vw-post-box__title a').text().trim();
			const link = $(el).find('.vw-post-box__title a').attr('href');
			const description = $(el)
				.find('.vw-post-box__excerpt p')
				.text()
				.trim();

			if (title && link && description) {
				articles.push({ title, link, description });
			}
		});

		return articles;
	} catch (error) {
		console.error('Error fetching GizChina news:', error);
		return [];
	}
}

async function Yahoo(query) {
	try {
		const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(
			query,
		)}`;
		const response = await axios.get(searchUrl);
		const $ = cheerio.load(response.data);

		const results = [];
		$('.algo').each((i, element) => {
			results.push({
				title: $(element).find('h3').text().trim(),
				description: $(element).find('.compText').text().trim(),
				url: $(element).find('a').attr('href'),
			});
		});

		return results;
	} catch (error) {
		console.error('Error scraping Yahoo:', error);
		return [];
	}
}

async function fetchForexData(url) {
	try {
		const response = await axios.get(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0 Safari/537.36',
			},
		});
		const html = response.data;
		const $ = cheerio.load(html);

		const headers = [];
		$('.upperLine-MSg2GmPp span').each((_, element) => {
			headers.push($(element).text().trim());
		});

		const rowsData = [];
		$(
			'tr.row-RdUXZpkv.listRow, tr.row-RdUXZpkv.listRow.focusedClass.cursor',
		).each((_, row) => {
			const rowData = {};

			const tickerCell = $(row).find('.tickerCell-GrtoTeat');
			rowData['Symbol'] = tickerCell
				.find('a.tickerNameBox-GrtoTeat')
				.text()
				.trim();
			rowData['Description'] = tickerCell
				.find('sup.tickerDescription-GrtoTeat')
				.text()
				.trim();

			$(row)
				.find('td.cell-RLhfr_y4')
				.each((index, cell) => {
					const headerName =
						headers[index] || `Column${index + 1}`;
					rowData[headerName] = $(cell).text().trim();
				});

			rowsData.push(rowData);
		});

		const data = rowsData.map(row => ({
			Symbol: row.Symbol,
			Pair: row.Description,
			Price: row.Column2,
			'Change %': row.Column3,
			Change: row.Column4,
			Bid: row.Column5,
			Ask: row.Column6,
			High: row.Column7,
			Low: row.Column8,
			Rating: row.Column9,
		}));

		return data;
	} catch (error) {
		console.error('Error fetching data:', error);
		throw error;
	}
}

async function ForexMajor() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-major/',
	);
}

async function ForexMinor() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-minor/',
	);
}

async function ForexExotic() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-exotic/',
	);
}

async function ForexAmericas() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-americas/',
	);
}

async function ForexEurope() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-europe/',
	);
}

async function ForexAsia() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-asia/',
	);
}

async function ForexPacific() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-pacific/',
	);
}

async function ForexAfrica() {
	return await fetchForexData(
		'https://www.tradingview.com/markets/currencies/rates-africa/',
	);
}

async function FootballNews() {
	try {
		const response = await axios.get(
			'https://www.eurosport.com/football/',
			{
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
