import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { FindReplaceContext } from '../../../../contexts/findReplaceContext';
import { LeftNavContext } from '../../../../contexts/leftNavContext';

import CaratDownSVG from '../../../../assets/svg/CaratDownSVG';
import CloseSVG from '../../../../assets/svg/CloseSVG';

import { findAllDocsInFolder, findInWholeProject } from '../../navFunctions';
import { findVisibleBlocks } from '../../../editor/editorFunctions';

import Collapse from 'react-css-collapse';
import FindResultLine from './FindResultLine';
import PushpinSVG from '../../../../assets/svg/PushpinSVG';

const FindAll = () => {
	// CONTEXT
	const {
		setShowFindAll,
		setFindText: setContextFindText,
		findRegisterRef,
		findIndex,
		setFindIndex,
		setTotalMatches,
		refocusFindAll,
		setRefocusFindAll,
		refocusReplaceAll,
		setRefocusReplaceAll,
		contextEditorRef,
		searchOpenDoc,
		setSearchOpenDoc,
	} = useContext(FindReplaceContext);
	const {
		docStructureRef,
		editorArchivesRef,
		editorStateRef,
		setNavData,
		navDataRef,
		editorStyles,
		setEditorStyles,
	} = useContext(LeftNavContext);

	// STATE
	const [showReplace, setShowReplace] = useState(false);
	const [findText, setFindText] = useState('');
	const [replaceText, setReplaceText] = useState('');
	const [findResults, setFindResults] = useState({});
	const [totalProjectResults, setTotalProjectResults] = useState(0);
	const [totalProjectIndex, setTotalProjectIndex] = useState(0);
	const [isDocOpen, setIsDocOpen] = useState({});

	const [currentResult, setCurrentResult] = useState({
		docName: '',
		index: 0,
	});

	// REF
	const queuedUpdateRef = useRef(null);
	const findInputRef = useRef(null);
	const replaceInputRef = useRef(null);
	const currentResultRef = useRef(null);

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

	// Queueing and debouncing the find update
	useEffect(() => {
		// Remove the previous search
		clearTimeout(queuedUpdateRef.current);

		// Queue up the search
		queuedUpdateRef.current = setTimeout(() => {
			// Reset if no search text
			if (!findText) {
				setTotalProjectIndex(0);
				setTotalProjectResults(0);
				setFindResults({});
				return;
			}

			// Search the whole project
			const newFindResults = findInWholeProject(
				editorArchivesRef.current,
				editorStateRef.current,
				navDataRef.current.currentDoc,
				findText
			);

			// Count the number of results for the whole project
			let newTotalResults = 0;
			Object.values(newFindResults).forEach(
				(resultsArray) => (newTotalResults += resultsArray.length)
			);

			setTotalProjectIndex(0);
			setTotalProjectResults(newTotalResults);
			setFindResults(newFindResults);
		}, 500);
	}, [findText, allDocs]);

	// Focus the find input
	useEffect(() => {
		if (refocusFindAll) {
			console.log('refocusFindAll:', refocusFindAll);
			// Focus on the find input
			// findEditorStateSelection();
			findInputRef.current.focus();
			setRefocusFindAll(false);
		}
	}, [refocusFindAll]);

	// Focus the replace input
	useEffect(() => {
		if (refocusReplaceAll) {
			console.log('refocusReplaceAll:', refocusReplaceAll);
			// Focus on the replace input
			// findEditorStateSelection();
			setShowReplace(true);
			setRefocusReplaceAll(false);
			setTimeout(() => {
				replaceInputRef.current.focus();
			}, 0);
		}
	}, [refocusReplaceAll]);

	// Re-search currentDoc when editorState changes
	useEffect(() => {
		if (searchOpenDoc) {
			// Remove the flag to re-search the currentDoc
			setSearchOpenDoc(false);

			if (!findText) {
				return;
			}

			const currentDoc = navDataRef.current.currentDoc;

			// Search the whole project
			const newFindResults = findInWholeProject(
				{},
				editorStateRef.current,
				currentDoc,
				findText,
				true // only search currentDoc
			);

			// Calculate change in number of currentDoc results
			const currentDocResultsChange =
				newFindResults[currentDoc].length -
				(findResults[currentDoc] ? findResults[currentDoc].length : 0);

			// Adjust the number of results by the change
			setTotalProjectResults((prev) => prev + currentDocResultsChange);

			// Only overwrite the currentDoc's results
			setFindResults((prev) => ({
				...prev,
				...newFindResults,
			}));
		}
	}, [searchOpenDoc, findResults, findText]);

	// Set the new result
	const updateResult = useCallback(
		(docName, index) => {
			// Finding what result number we are on for ALL results
			let newIndex = 0;
			for (let doc of allDocs) {
				if (doc.fileName === docName) {
					// If we found our document, add the index we're on in that document and stop searching
					newIndex += index;
					break;
				} else {
					// Adding up all results BEFORE our result
					newIndex += findResults[doc.fileName].length;
				}
			}

			setNavData((prev) => {
				if (prev.currentDoc === docName) {
					return prev;
				} else {
					findRegisterRef.current[findText.toLowerCase()] = [];
					return {
						...prev,
						currentDoc: docName,
					};
				}
			});
			setCurrentResult({ docName, index });
			setTotalProjectIndex(newIndex + 1); // +1 because indexes start at 0
			// Set the index at the end of the call stack
			setTimeout(() => {
				setTotalMatches(findResults[docName].length);
				setFindIndex(index);

				// Scroll to the selected result in the results bar
				if (currentResultRef.current) {
					currentResultRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				}
			}, 0);
		},
		[findText, allDocs, findResults]
	);

	// Increment/decrement the selected result
	const updateFindIndexProject = useCallback(
		(direction) => {
			const currentDoc = navDataRef.current.currentDoc;

			// Build an array of all results with the docName added
			let allResultsArray = [];
			for (let doc of allDocs) {
				// const newResults = findResults[doc.fileName].map((item) => ({
				// 	...item,
				// 	docName: doc.fileName,
				// }));
				allResultsArray = [...allResultsArray, ...findResults[doc.fileName]];
			}

			// If no results, exit the function
			if (!allResultsArray.length) {
				return;
			}

			// If no index to start from
			if (findIndex === null) {
				// If the current doc has results
				if (findResults[currentDoc].length) {
					// List all blocks on screen (array of block keys)
					let visibleBlocks = findVisibleBlocks(contextEditorRef.current);

					// Look for the first match on screen
					let visibleResultIndex = -1;
					findResults[currentDoc].some((result, index) => {
						if (visibleBlocks.includes(result.key)) {
							visibleResultIndex = index;
							return true;
						}
					});

					// If a result is visible on screen, select it
					if (visibleResultIndex !== -1) {
						updateResult(currentDoc, visibleResultIndex);
						return;
					}

					// If no onscreen match, find the first offscreen match.
					// We know there are matches in this document.

					// If not on screen, iterate through the off-screen blocks to find the first match
					let contentState = editorStateRef.current.getCurrentContent();
					const blockKeysWithMatches = findResults[currentDoc].map((item) => item.key);

					// Start with the last block on screen
					let blockKey = visibleBlocks[visibleBlocks.length - 1];
					while (true) {
						// Move to the next block
						let block = contentState.getBlockAfter(blockKey);
						if (!block) {
							// Or the first block if we were at the last
							block = contentState.getFirstBlock();
						}
						// Update the block key for the next iteration
						blockKey = block.getKey();

						if (blockKeysWithMatches.includes(blockKey)) {
							let matchIndex = findResults[currentDoc].findIndex(
								(item) => item.key === blockKey
							);
							updateResult(currentDoc, matchIndex);
							return;
						}
					}
				}

				// If the current doc doesn't have results, find the first doc with a result
				updateResult(allResultsArray[0].docName, 0);
				return;
			}

			// If incrementing
			if (direction === 'INCREMENT') {
				// If we've reached the end of the current document, move to the next
				if (findResults[currentResult.docName].length - 1 === currentResult.index) {
					// Find the current result object
					const current = findResults[currentResult.docName][currentResult.index];

					// Find the index in the total matches for the entire project
					const currentIndex = allResultsArray.findIndex(
						(item) =>
							item.docName === currentResult.docName &&
							item.key === current.key &&
							item.start === current.start
					);

					// Find the incremented result from that array, starting over if at the end
					let newResult =
						currentIndex === allResultsArray.length - 1
							? allResultsArray[0]
							: allResultsArray[currentIndex + 1];

					updateResult(
						newResult.docName,
						0 // We know we're starting a new doc, so the index is 0
					);
				} else {
					// Otherwise, increment to the next
					updateResult(currentResult.docName, currentResult.index + 1);
				}
			}

			if (direction === 'DECREMENT') {
				// If we're at the start of the new document
				if (currentResult.index === 0) {
					// Find the current result object
					const current = findResults[currentResult.docName][currentResult.index];

					// Find the index in the total matches for the entire project
					const currentIndex = allResultsArray.findIndex(
						(item) =>
							item.docName === currentResult.docName &&
							item.key === current.key &&
							item.start === current.start
					);

					// Find the decremented result from that array, looping to the end if at the start
					let newResult =
						currentIndex === 0
							? allResultsArray[allResultsArray.length - 1]
							: allResultsArray[currentIndex - 1];

					updateResult(
						newResult.docName,
						findResults[newResult.docName].length - 1 // We know we're at the end of the new doc
					);
				} else {
					// Otherwise, decrement to the previous
					updateResult(currentResult.docName, currentResult.index - 1);
				}
			}
		},
		[findResults, findIndex, currentResult, findText, updateResult, contextEditorRef]
	);

	// Move the find selection forwards/backwards
	const handleInputEnter = useCallback(
		(e) => {
			// If enter was pressed
			if (e.key === 'Enter') {
				if (e.shiftKey) {
					updateFindIndexProject('DECREMENT');
				} else {
					updateFindIndexProject('INCREMENT');
				}
			}
		},
		[updateFindIndexProject]
	);

	const closeFn = useCallback(() => {
		// Reset the find
		findRegisterRef.current[findText.toLowerCase()] = [];
		setContextFindText('');
		setFindIndex(null);
		setTotalMatches(0);

		// Close the panel
		setShowFindAll(false);
	}, [findText]);

	// Close the find popper on ESCAPE
	useEffect(() => {
		const closeEventListener = (e) => {
			if (e.keyCode === 27) {
				closeFn();
			}
		};
		document.addEventListener('keyup', closeEventListener);

		return () => document.removeEventListener('keyup', closeEventListener);
	}, [closeFn]);

	// console.log('allDocs:', allDocs);
	// console.log('editorArchives: ', editorArchivesRef.current);

	return (
		<div className='side-nav-container'>
			<p className='left-nav-section-title'>
				Find
				<button
					className={'project-find nav-button' + (editorStyles.leftIsPinned ? ' active' : '')}
					title='Pin Find Navigation'
					onMouseUp={() => {
						setEditorStyles((prev) => ({ ...prev, leftIsPinned: !prev.leftIsPinned }));
					}}>
					<PushpinSVG />
				</button>
			</p>

			<div className='project-find-container'>
				<div className='project-find-navigation-row flex-row-center'>
					<p className='find-containter-counter'>
						{/* {findText && findRegisterRef.current[findText.toLowerCase()] && totalMatches
					? `${findIndex === null ? 1 : findIndex + 1} of ${totalMatches}`
					: '0 matches'} */}
						{totalProjectIndex
							? `${totalProjectIndex} of ${totalProjectResults}`
							: `${totalProjectResults} results`}
					</p>

					<div
						className='find-container-svg'
						onClick={() => updateFindIndexProject('DECREMENT')}>
						<CaratDownSVG rotate='90' />
					</div>
					<div
						className='find-container-svg'
						onClick={() => updateFindIndexProject('INCREMENT')}>
						<CaratDownSVG rotate='-90' />
					</div>
					<div className='find-container-svg' onClick={closeFn}>
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
							ref={findInputRef}
							value={findText}
							onChange={(e) => {
								console.log('on change fired');
								findRegisterRef.current[e.target.value.toLowerCase()] = [];
								setFindIndex(null);
								setFindText(e.target.value);
								setContextFindText(e.target.value);
							}}
							onKeyDown={handleInputEnter}
						/>
						<Collapse isOpen={showReplace}>
							<input
								type='text'
								placeholder='Replace'
								ref={replaceInputRef}
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
			<div
				className='project-find-results-container'
				// ref={resultsContainerRef}
			>
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
									{findResults[doc.fileName].map((item, i) => (
										<FindResultLine
											result={item}
											isCurrentResult={
												currentResult.docName === doc.fileName && currentResult.index === i
											}
											width={editorStyles.leftNavFind}
											currentResultRef={currentResultRef}
											handleClick={() => updateResult(doc.fileName, i)}
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
