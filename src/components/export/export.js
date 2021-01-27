import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ipcRenderer } from 'electron';

export const exportProject = async ({
	editorStateRef,
	editorArchivesRef,
	docStructureRef,
	mediaStructureRef,
	projectRef,
}) => {
	// const currentContent = editorStateRef.current.getCurrentContent();

	// const doc = new Document();

	// doc.addSection({
	// 	properties: {},
	// 	children: [
	// 		new Paragraph({
	// 			children: [
	// 				new TextRun('Hello World'),
	// 				new TextRun({
	// 					text: 'Foo Bar',
	// 					bold: true,
	// 				}),
	// 				new TextRun({
	// 					text: '\tGithub is the best',
	// 					bold: true,
	// 				}),
	// 			],
	// 		}),
	// 	],
	// });

	const childrenArray = [
		{
			text: 'Foo Bar',
			bold: true,
		},
		{
			text: 'Foo Bar',
			bold: true,
		},
		{
			text: 'Foo Bar',
			bold: true,
		},
	];

	// const newBuffer = Packer.toBuffer(doc);
	ipcRenderer.invoke(
		'export-project',
		projectRef.current.tempPath,
		'Test.docx',
		childrenArray
	);
};
