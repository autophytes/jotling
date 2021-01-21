import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { FindReplaceContext } from '../../../../contexts/findReplaceContext';
import { LeftNavContext } from '../../../../contexts/leftNavContext';

import CaratDownSVG from '../../../../assets/svg/CaratDownSVG';
import CloseSVG from '../../../../assets/svg/CloseSVG';

import { findAllDocsInFolder, findInWholeProject } from '../../navFunctions';

import Collapse from 'react-css-collapse';
import FindResultLine from './FindResultLine';

const FindAll = () => {
	// CONTEXT
	const { setShowFindReplaceAll } = useContext(FindReplaceContext);
	const {
		docStructureRef,
		editorArchivesRef,
		editorStateRef,
		setNavData,
		navDataRef,
		editorStyles,
	} = useContext(LeftNavContext);

	// STATE
	const [showReplace, setShowReplace] = useState(false);
	const [findText, setFindText] = useState('');
	const [replaceText, setReplaceText] = useState('');
	const [findResults, setFindResults] = useState({});
	const [isDocOpen, setIsDocOpen] = useState({});

	// REF
	const queuedUpdateRef = useRef(null);

	// MEMO
	const allDocs = useMemo(() => {
		const manuscriptDocs = findAllDocsInFolder(docStructureRef.current['draft']);
		const planningDocs = findAllDocsInFolder(docStructureRef.current['research']);
		const wikiDocs = findAllDocsInFolder(docStructureRef.current['pages']);

		return [...manuscriptDocs, ...planningDocs, ...wikiDocs];
	}, []);

	// Initialize the open documents
	useEffect(() => {
		let newIsDocOpen = {};
		for (let doc of allDocs) {
			newIsDocOpen[doc.fileName] = true;
		}
		setIsDocOpen(newIsDocOpen);
	}, [allDocs]);

	console.log('allDocs:', allDocs);

	// Queueing and debouncing the find update
	useEffect(() => {
		// Skip if no search text
		if (!findText) {
			return;
		}

		// Remove the previous search
		clearTimeout(queuedUpdateRef.current);

		// Queue up the search
		queuedUpdateRef.current = setTimeout(() => {
			console.log('update the find results');

			// Search the whole project
			const newFindResults = findInWholeProject(
				editorArchivesRef.current,
				editorStateRef.current,
				navDataRef.current.currentDoc,
				findText
			);

			setFindResults(newFindResults);

			console.log('newFindResults:', newFindResults);

			// editorArchivesRef
			// editorStateRef
			// navDataRef.currentDocument
			// findText
			// allDocs
		}, 500);
	}, [findText, allDocs]);

	const handleResultClick = useCallback((docName) => {
		setNavData((prev) => {
			if (prev.currentDoc === docName) {
				return prev;
			} else {
				return {
					...prev,
					currentDoc: docName,
				};
			}
		});
	}, []);

	// console.log('allDocs:', allDocs);
	// console.log('editorArchives: ', editorArchivesRef.current);

	return (
		<div className='side-nav-container'>
			<p className='left-nav-section-title'>Find</p>

			<div className='project-find-container'>
				<div className='project-find-navigation-row flex-row-center'>
					<p className='find-containter-counter'>
						{/* {findText && findRegisterRef.current[findText.toLowerCase()] && totalMatches
					? `${findIndex === null ? 1 : findIndex + 1} of ${totalMatches}`
					: '0 matches'} */}
						3 of 27
					</p>

					<div
						className='find-container-svg'
						// onClick={() => updateFindIndex('DECREMENT')}
					>
						<CaratDownSVG rotate='90' />
					</div>
					<div
						className='find-container-svg'
						// onClick={() => updateFindIndex('INCREMENT')}
					>
						<CaratDownSVG rotate='-90' />
					</div>
					<div
						className='find-container-svg'
						onClick={() => {
							// setContextFindText('');
							// setShowFindReplace(false);
							setShowFindReplaceAll(false);
						}}>
						<CloseSVG />
					</div>
				</div>

				<div className='project-find-input-section'>
					<div
						className={'find-container-svg' + (showReplace ? ' expanded' : '')}
						onClick={() => setShowReplace(!showReplace)}>
						<CaratDownSVG rotate='-90' />
					</div>

					<div className='project-find-input-wrapper'>
						<input
							type='text'
							placeholder='Find'
							autoFocus
							// ref={findInputRef}
							value={findText}
							onChange={(e) => {
								console.log('on change fired');
								// findRegisterRef.current[e.target.value.toLowerCase()] = [];
								setFindText(e.target.value);
								// setContextFindText(e.target.value);
							}}
							// onKeyDown={handleInputEnter}
						/>
						<Collapse isOpen={showReplace}>
							<input
								type='text'
								placeholder='Replace'
								// ref={replaceInputRef}
								value={replaceText}
								onChange={(e) => {
									setReplaceText(e.target.value);
									// setContextReplaceText(e.target.value);
								}}
							/>
						</Collapse>
					</div>
				</div>

				<Collapse isOpen={showReplace}>
					<div className='project-find-container-replace-button-row'>
						<button
							className='project-find-container-replace-button'
							// onClick={handleReplaceSingle}
						>
							One
						</button>
						<button
							className='project-find-container-replace-button'
							// onClick={handleReplaceAll}
						>
							All
						</button>
					</div>
				</Collapse>
			</div>

			{/* RESULTS */}
			<div className='project-find-results-container'>
				{allDocs.map((doc) => {
					if (!findResults.hasOwnProperty(doc.fileName) || !findResults[doc.fileName].length) {
						return null;
					}

					// Render something
					return (
						<div className='file-nav folder' key={doc.id} style={{ marginBottom: '0.25rem' }}>
							<button
								className={'project-find-document file-nav document'}
								onClick={() =>
									setIsDocOpen((prev) => ({
										...prev,
										[doc.fileName]: !isDocOpen[doc.fileName],
									}))
								}>
								<div className='svg-wrapper'>
									<CaratDownSVG rotate={isDocOpen[doc.fileName] ? '0' : '-90'} />
								</div>
								<span>{doc.name}</span>
							</button>

							<Collapse
								isOpen={isDocOpen[doc.fileName]}
								className='react-css-collapse-transition project-find'>
								<div className='folder-contents'>
									{findResults[doc.fileName].map((item) => (
										<FindResultLine
											result={item}
											width={editorStyles.leftNav}
											handleClick={() => handleResultClick(doc.fileName)}
											key={item.key + item.start}
										/>
									))}
								</div>
							</Collapse>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default FindAll;

// allDocs: {
//   fileName: "doc1.json"
//   id: 1
//   name: "Home Again"
//   path: "folders/1/children"
//   type: "doc"
// }
