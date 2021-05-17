const { minify } = require('minify-xml')
const fs = require('fs')
const ejs = require('ejs')

const ExitCodes = {
	Success: 0,
	Unknown: 1,
	ConfigMissingProperties: 10
}

const chars = [
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
	'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
	'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
	'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
	'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7',
	'8', '9', '_', '-'
]

const charsWidth = [
	55.616668701171875, 55.616668701171875, 50.000000000000000,
	55.616668701171875, 55.616668701171875, 27.783340454101562,
	55.616668701171875, 55.616668701171875, 22.216659545898438,
	22.216659545898438, 50.000000000000000, 22.216659545898438,
	83.300003051757810, 55.616668701171875, 55.616668701171875,
	55.616668701171875, 55.616668701171875, 33.300003051757810,
	50.000000000000000, 27.783340454101562, 55.616668701171875,
	50.000000000000000, 72.216659545898440, 50.000000000000000,
	50.000000000000000, 50.000000000000000, 66.699996948242190,
	66.699996948242190, 72.216659545898440, 72.216659545898440,
	66.699996948242190, 61.083328247070310, 77.783340454101560,
	72.216659545898440, 27.783340454101562, 50.000000000000000,
	66.699996948242190, 55.616668701171875, 83.300003051757810,
	72.216659545898440, 77.783340454101560, 66.699996948242190,
	77.783340454101560, 72.216659545898440, 66.699996948242190,
	61.083328247070310, 72.216659545898440, 66.699996948242190,
	94.383331298828120, 66.699996948242190, 66.699996948242190,
	61.083328247070310, 55.616668701171875, 55.616668701171875,
	55.616668701171875, 55.616668701171875, 55.616668701171875,
	55.616668701171875, 55.616668701171875, 55.616668701171875,
	55.616668701171875, 55.616668701171875, 55.616668701171875,
	33.300003051757810
]

function hslToHex(h, s, l) {
	l /= 100
	const a = s * Math.min(l, 1 - l) / 100
	const f = n => {
		const k = (n + h / 30) % 12
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
		return Math.round(255 * color).toString(16).padStart(2, '0')
	}
	return `${f(0)}${f(8)}${f(4)}`
}

function generate(name, description, hue) {
	return new Promise(resolve => {
		ejs.renderFile('resources/banner.xml', {
			name,
			description,
			hue,
			mainColor: hslToHex(hue, 100, 70),
			stop1Color: hslToHex(hue, 100, 98),
			stop2Color: hslToHex(hue, 100, 93),
			titleFontSize: 51,
			titleY: 150,
			descriptionFontSize: 22,
			titleX: 393 - name.split('').map(char => charsWidth[chars.indexOf(char)]).reduce((a, b) => a + b, 0) / 2,
			iconSize: 42,
			iconMargin: 64
		}).then(xml => {
			xml = minify(xml, {
				removeComments: false,
				removeWhitespaceBetweenTags: true,
				collapseWhitespaceInTags: true,
				collapseEmptyElements: true,
				trimWhitespaceFromTexts: false,
				collapseWhitespaceInTexts: false,
				collapseWhitespaceInProlog: true,
				collapseWhitespaceInDocType: true,
				removeUnusedNamespaces: false,
				removeUnusedDefaultNamespace: false,
				shortenNamespaces: false,
				ignoreCData: true
			}).replace('?>', '?>\n')

			resolve({
				xml: xml,
				base64: 'data:image/svg+xml;base64,' + btoa(xml)
			})
		})
	})
}

const banners = fs.readdirSync('static/banners/src').map(json => json.slice(0, -5))

for (const banner of banners) {
	const configFilePath = `static/banners/src/${banner}.json`
	const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'))
	const svgFilePath = `static/banners/dist/${banner}.svg`
	const base64FilePath = `static/banners/dist/${banner}.b64`

	let requiredKeys = ['name', 'description', 'hue']
	for (const key in config) {
		if (Object.hasOwnProperty.call(config, key)) {
			const index = requiredKeys.indexOf(key)
			requiredKeys.splice(index, 1)
		}
	}

	if (requiredKeys.length > 1) {
		console.error(`Banner config ${banner} is missing required propert${requiredKeys.length === 1 ? 'y' : 'ies'}: ${requiredKeys.map(key => `'${key}'`).join(', ')}.`)
		process.exit(ExitCodes.ConfigMissingProperties)
	}

	if (fs.existsSync(svgFilePath) && fs.existsSync(base64FilePath)) {
		try {
			const svg = fs.readFileSync(svgFilePath, 'utf-8')
			const svgConfigRaw = /<!--:(.+?):-->/.exec(svg)?.[1]

			if (svgConfigRaw) {
				const svgConfig = JSON.parse(atob(svgConfigRaw))

				if (svgConfig.name === config.name && svgConfig.description === config.description && svgConfig.hue === config.hue) {
					continue
				}
			}
		} catch {

		}
	}

	generate(config.name, config.description, config.hue).then(({ xml, base64 }) => {
		const lines = xml.split('\n')

		fs.writeFileSync(svgFilePath, `${lines[0]}\n<!--:${btoa(config)}:-->\n${lines[1]}\n`, { encoding: 'utf-8' })
		fs.writeFileSync(base64FilePath, base64, { encoding: 'utf-8' })
	})
}