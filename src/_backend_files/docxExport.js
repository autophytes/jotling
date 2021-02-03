const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const docx = require('docx');
const {
	UnderlineType,
	AlignmentType,
	HeadingLevel,
	Media,
	HorizontalPositionRelativeFrom,
	HorizontalPositionAlign,
	VerticalPositionRelativeFrom,
	VerticalPositionAlign,
	TextWrappingType,
	TextWrappingSide,
} = require('docx');
const { constants } = require('os');

// Generate a docx with the
const exportDocument = ({ pathName, docName, docObj, mediaStructure }) => {
	let childArray = [];

	const doc = new docx.Document(docxConfig);

	for (let block of docObj.blocks) {
		childArray.push(genDocxParagraph(block, doc, pathName, mediaStructure));
	}

	doc.addSection({
		properties: {},
		children: childArray,
	});

	docx.Packer.toBuffer(doc).then((buffer) => {
		fs.writeFileSync(path.join(pathName, docName), buffer);
	});
};

// Increment folder names until they are unique
const findUniqueFolderName = (filePath, folderName) => {
	// Ensure the project folder name is unique
	let newFolderName = folderName;
	let index = 1;

	const usedFileNames = fs.readdirSync(filePath);
	while (usedFileNames.includes(newFolderName)) {
		newFolderName = folderName + `(${index})`;
		index++;
	}

	return newFolderName;
};

// Create a file system folder for each project folder
const generateAllChildrenFolders = (currentFolder, folderPath) => {
	// For this folder level's children, add all docs to the docArray
	for (let child of currentFolder.children) {
		if (child.type === 'folder') {
			const newFolderName = findUniqueFolderName(folderPath, child.name);
			fs.mkdirSync(path.join(folderPath, newFolderName));

			generateAllChildrenFolders(currentFolder.folders[child.id.toString()], folderPath);
		}
	}
};

const generateExportFolderStructure = ({
	pathName,
	folderName = 'Project Export',
	docStructure,
}) => {
	// Ensure the project folder name is unique
	const projectFolderName = findUniqueFolderName(pathName, folderName);

	// Create the top-level export folder
	fs.mkdirSync(path.join(pathName, projectFolderName));

	const topLevelFolders = {
		draft: 'Manuscript',
		research: 'Planning',
		pages: 'Wikis',
	};

	for (let key in topLevelFolders) {
		// Create parent folder
		const newFolderPath = path.join(pathName, projectFolderName, topLevelFolders[key]);
		fs.mkdirSync(path.join(pathName, projectFolderName, topLevelFolders[key]));
		generateAllChildrenFolders(docStructure[key], newFolderPath);

		// Create all children folders
		// call our function below
	}
};

const genDocxParagraph = (block, doc, pathName, mediaStructure) => {
	// Add IDs to the style ranges
	const inlineStyleRanges = block.inlineStyleRanges.map((item, i) => ({
		...item,
		id: i,
	}));

	let newChildren = [];
	if (inlineStyleRanges.length) {
		let breakpoints = [0, block.text.length];

		inlineStyleRanges.forEach((item) => {
			breakpoints.push(item.offset);
			breakpoints.push(item.offset + item.length);
		});

		breakpoints = [...new Set(breakpoints)];
		breakpoints.sort((a, b) => a - b);

		breakpoints.forEach((index, i) => {
			// No textRun for the last breapoint
			if (i === breakpoints.length - 1) {
				return;
			}

			let newStyles = inlineStyleRanges.filter(
				(item) => item.offset <= index && item.offset + item.length > index
			);

			let newTextRunObj = {
				text: block.text.slice(index, breakpoints[i + 1]),
			};
			for (let style of newStyles) {
				// BASIC STYLES
				switch (style.style) {
					case 'BOLD':
						newTextRunObj.bold = true;
						break;
					case 'ITALIC':
						newTextRunObj.italics = true;
						break;
					case 'STRIKETHROUGH':
						newTextRunObj.strike = true;
						break;
					case 'SUBSCRIPT':
						newTextRunObj.subScript = true;
						break;
					case 'SUPERSCRIPT':
						newTextRunObj.superScript = true;
						break;
					case 'UNDERLINE':
						newTextRunObj.underline = {
							type: UnderlineType.SINGLE,
							color: null,
						};
						break;
					default:
				}

				// TEXTCOLOR / HIGHLIGHT
				if (style.style.slice(0, 9) === 'TEXTCOLOR') {
					newTextRunObj.color = style.style.slice(-6);
				}
				if (style.style.slice(0, 9) === 'HIGHLIGHT') {
					newTextRunObj.highlight = findNearestHighlightColor(style.style.slice(-6));
				}
			}

			newChildren.push(new docx.TextRun(newTextRunObj));
		});
	} else {
		newChildren.push(new docx.TextRun(block.text));
	}

	// IMAGES
	if (block.data.images && block.data.images.length) {
		for (let image of block.data.images) {
			const imageFileName = mediaStructure[image.imageId].fileName;
			const imagePath = path.join(pathName, 'media', imageFileName);

			// Image dimensions - scale to roughly 1/2 page
			// 1 word page is roughly 600 points
			// 235 points is roughly 1/2 a page with 1" margins
			const dimensions = sizeOf(imagePath);
			const constraintRatio = Math.min(
				Math.min(300, dimensions.width) / dimensions.width,
				Math.min(400, dimensions.height) / dimensions.height
			);
			const width = dimensions.width * constraintRatio;
			const height = dimensions.height * constraintRatio;

			// Image Position
			let imagePositionOptions = {
				floating: {
					horizontalPosition: {
						relative: HorizontalPositionRelativeFrom.MARGIN,
						align: HorizontalPositionAlign.LEFT,
					},
					verticalPosition: {
						relative: VerticalPositionRelativeFrom.PARAGRAPH,
						align: VerticalPositionAlign.TOP,
					},
					wrap: {
						type: TextWrappingType.SQUARE,
					},
					margins: {
						right: 100720,
					},
				},
			};
			if (!block.text) {
				// No wrap, float left
				imagePositionOptions.floating.wrap = {
					type: TextWrappingType.TOP_AND_BOTTOM,
				};
			} else {
				if (!image.float || image.float === 'right') {
					// Text wrap, float right
					imagePositionOptions.floating.horizontalPosition.align =
						HorizontalPositionAlign.RIGHT;
					imagePositionOptions.floating.margins.right = 0;
					imagePositionOptions.floating.margins.left = 100720;
				}
				// Defualts to text wrap, float left
			}

			const docxImage = Media.addImage(
				doc,
				fs.readFileSync(imagePath),
				width,
				height,
				imagePositionOptions
			);

			newChildren.unshift(docxImage);
		}
	}

	let paragraph = { children: newChildren };

	// Text Align
	if (block.data.hasOwnProperty('text-align')) {
		paragraph.alignment = AlignmentType[block.data['text-align'].toUpperCase()];
	}

	// Bullet Lists
	if (block.type === 'unordered-list-item') {
		paragraph.bullet = {
			level: block.depth,
		};
	}

	// Numbered Lists
	if (block.type === 'ordered-list-item') {
		paragraph.numbering = {
			reference: 'default-numbering',
			level: block.depth,
		};
	}

	// Headings
	switch (block.type) {
		case 'header-one':
			paragraph.heading = HeadingLevel.HEADING_1;
			break;
		case 'header-two':
			paragraph.heading = HeadingLevel.HEADING_2;
			break;
		case 'header-three':
			paragraph.heading = HeadingLevel.HEADING_3;
			break;
		case 'header-four':
			paragraph.heading = HeadingLevel.HEADING_4;
			break;
		default:
	}

	return new docx.Paragraph(paragraph);
};

// Highlight colors availaible for Microsoft Word
const HIGHLIGHT_COLORS = {
	// black: [0, 0, 0],
	// lightGray: [192, 192, 192],
	// darkGray: [128, 128, 128],
	// white: [255, 255, 255],
	blue: [32, 0, 255],
	green: [82, 255, 0],
	darkBlue: [10, 0, 128],
	darkRed: [128, 0, 0],
	darkYellow: [128, 127, 0],
	darkGreen: [37, 128, 0],
	magenta: [245, 0, 255],
	red: [243, 1, 5],
	darkCyan: [40, 128, 128],
	cyan: [89, 255, 254],
	darkMagenta: [128, 0, 128],
	yellow: [253, 255, 0],
};

// Find the closest available Highlight color in Microsoft Word
const findNearestHighlightColor = (hexColor) => {
	// Convert the current highlight color to RGB
	const r = parseInt(hexColor.slice(0, 2), 16);
	const g = parseInt(hexColor.slice(2, 4), 16);
	const b = parseInt(hexColor.slice(-2), 16);

	// Loop through the available highlight colors in Word
	// Calculate the closest color
	let closest = { color: '', distance: Number.MAX_VALUE };
	for (let [color, array] of Object.entries(HIGHLIGHT_COLORS)) {
		// Calculate the Euclidian distance between the colors
		//   weighted: https://web.archive.org/web/20100316195057/http://www.dfanning.com/ip_tips/color2gray.html
		let newDistance = Math.sqrt(
			(r - array[0]) ** 2 + (g - array[1]) ** 2 + (b - array[2]) ** 2
			// ((r - array[0]) * 0.3) ** 2 + ((g - array[1]) * 0.59) ** 2 + ((b - array[2]) * 0.11) ** 2
		);

		// Save if the closest
		if (newDistance < closest.distance) {
			closest = {
				color: color,
				distance: newDistance,
			};
		}
	}

	return closest.color;
};

const docxConfig = {
	numbering: {
		config: [
			{
				reference: 'default-numbering',
				levels: [
					{
						level: 0,
						format: 'decimal',
						text: '%1.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 720, hanging: 360 },
							},
						},
					},
					{
						level: 1,
						format: 'lowerLetter',
						text: '%2.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 1440, hanging: 360 },
							},
						},
					},
					{
						level: 2,
						format: 'lowerRoman',
						text: '%3.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 2160, hanging: 360 },
							},
						},
					},
					{
						level: 3,
						format: 'decimal',
						text: '%4.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 2880, hanging: 360 },
							},
						},
					},
					{
						level: 4,
						format: 'lowerLetter',
						text: '%5.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 3600, hanging: 360 },
							},
						},
					},
					{
						level: 5,
						format: 'lowerRoman',
						text: '%6.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 4320, hanging: 360 },
							},
						},
					},
					{
						level: 6,
						format: 'decimal',
						text: '%7.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 5040, hanging: 360 },
							},
						},
					},
					{
						level: 7,
						format: 'lowerLetter',
						text: '%8.',
						alignment: AlignmentType.START,
						suffix: 'none',
						style: {
							paragraph: {
								indent: { left: 5760, hanging: 360 },
							},
						},
					},
				],
			},
		],
	},
	styles: {
		paragraphStyles: [
			{
				// Only `name` prop required, `id` not necessary
				name: 'Normal',
				run: {
					font: 'Calibri',
					size: 24,
				},
				paragraph: {
					spacing: {
						after: 120,
					},
				},
			},
		],
	},
};

module.exports = {
	exportDocument,
	generateExportFolderStructure,
};
