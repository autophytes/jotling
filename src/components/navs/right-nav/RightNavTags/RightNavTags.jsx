import React, { useContext, useState, useEffect, useCallback, Fragment } from 'react';
import CloseSVG from '../../../../assets/svg/CloseSVG';
import PlusSVG from '../../../../assets/svg/PlusSVG';

import TextareaAutosize from 'react-textarea-autosize';

const RightNavTags = ({ activeTab }) => {
	return (
		<>
			<div className='tags-row'>
				<div className='tags-row-button'>
					<CloseSVG />
					Character
				</div>
				<div className='tags-row-button'>
					<CloseSVG />
					Faction
				</div>
				<div className='tags-row-button'>
					<CloseSVG />
					Magic User
				</div>
				<div className='tags-row-button add-tag'>
					<PlusSVG />
					Tag
				</div>
			</div>

			<div className='tags-content'>
				<div className='tag-section'>
					<p className='tag-section-title'>Character</p>
					<div className='tag-section-fields'>
						<p className='tag-section-key'>Height</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'5\'10"'}
							className='tag-section-value'
						/>
						<p className='tag-section-key'>Weight</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'175lbs'}
							className='tag-section-value'
						/>
						<p className='tag-section-key'>Hair</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'Brown, short cut, wavy'}
							className='tag-section-value'
						/>
					</div>
				</div>
				<div className='tag-section'>
					<p className='tag-section-title'>Faction</p>
					<div className='tag-section-fields'>
						<p className='tag-section-key'>Rank</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'New guy'}
							className='tag-section-value'
						/>
						<p className='tag-section-key'>Superior Officer</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'Billy'}
							className='tag-section-value'
						/>
						<p className='tag-section-key'>Introduction</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'This character met billy bob at the thing and they talked for a while'}
							className='tag-section-value'
						/>
					</div>
				</div>
				<div className='tag-section'>
					<p className='tag-section-title'>Faction</p>
					<div className='tag-section-fields'>
						<p className='tag-section-key'>Rank</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'New guy'}
							className='tag-section-value'
						/>
						<p className='tag-section-key'>Superior Officer</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'Billy'}
							className='tag-section-value'
						/>
						<p className='tag-section-key'>Introduction</p>
						<TextareaAutosize
							minRows={1}
							maxRows={6}
							value={'This character met billy bob at the thing and they talked for a while'}
							className='tag-section-value'
						/>
					</div>
				</div>
			</div>
		</>
	);
};

export default RightNavTags;
