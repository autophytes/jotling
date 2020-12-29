import React, { useContext, useEffect, useState } from 'react';

import Collapse from 'react-css-collapse';
import { LeftNavContext } from '../../contexts/leftNavContext';
import { findFilePath, retrieveContentAtPropertyPath } from '../../utils/utils';

const EditorTableOfContents = () => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [sections, setSections] = useState([]);

	const { docStructure, navData } = useContext(LeftNavContext);

	useEffect(() => {
		// Keep a list of all of the sections on the page. If none, don't show the ToC.
		const { currentDoc, currentDocTab } = navData;

		const docId = currentDoc ? Number(currentDoc.slice(3, -5)) : 0;

		// Find the children array that contains our document
		const filePath = findFilePath(docStructure[currentDocTab], '', 'doc', docId);
		const childrenPath = filePath + (filePath ? '/' : '') + 'children';
		let childrenArray = retrieveContentAtPropertyPath(
			childrenPath,
			docStructure[currentDocTab]
		);

		// If we can't find the document, exit.
		// This happens when switching documents and the tab hasn't switched yet.
		if (!childrenArray) {
			return;
		}

		// Grab the individual document
		const docIndex = childrenArray.findIndex(
			(item) => item.type === 'doc' && item.id === docId
		);
		const docObject = childrenArray[docIndex];

		// The array of wiki sections
		const docSections = docObject.sections ? [...docObject.sections] : [];
		setSections(docSections);
	}, [docStructure, navData]);

	// Scroll to the clicked section
	const handleSectionClick = (blockKey) => {
		const sectionEl = document.querySelector(`[data-offset-key="${blockKey}-0-0"]`);
		const sectionTop = sectionEl.getBoundingClientRect().top;
		window.scrollTo({ top: sectionTop - 200, behavior: 'smooth' });
	};

	return (
		// Only rendered if we have sections in the page
		!!sections.length && (
			<div style={{ display: 'flex', alignItems: 'flex-start' }}>
				<div className='editor-table-contents-wrapper'>
					{/* Title */}
					<span className='editor-table-contents-title'>Table of Contents</span>

					{/* Table of Contents */}
					<Collapse isOpen={!isCollapsed}>
						<ol className='editor-table-contents-list'>
							{sections.map((item) => (
								<li key={item.key}>
									<span
										className='editor-table-contents-item'
										onClick={() => handleSectionClick(item.key)}>
										{item.text}
									</span>
								</li>
							))}
						</ol>
					</Collapse>
				</div>
				<span
					className='editor-table-contents-expand'
					onClick={() => setIsCollapsed((prev) => !prev)}>
					{isCollapsed ? 'Expand' : 'Collapse'}
				</span>
			</div>
		)
	);
};

export default EditorTableOfContents;
