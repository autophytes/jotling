import React, { useContext, useState, useEffect, useCallback, Fragment } from 'react';
import CloseSVG from '../../../../assets/svg/CloseSVG';
import PlusSVG from '../../../../assets/svg/PlusSVG';

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
						<p className='tag-section-value'>5'10"</p>
						<p className='tag-section-key'>Weight</p>
						<p className='tag-section-value'>175lbs</p>
						<p className='tag-section-key'>Hair</p>
						<p className='tag-section-value'>Brown, short cut, wavy</p>
					</div>
				</div>
				<div className='tag-section'>
					<p>Faction</p>
					<div className='tag-section-fields'>
						<p className='tag-section-key'>Rank</p>
						<p className='tag-section-value'>New guy</p>
						<p className='tag-section-key'>Superior Officer</p>
						<p className='tag-section-value'>Billy</p>
						<p className='tag-section-key'>Introduction</p>
						<p className='tag-section-value'>
							This character met billy bob at the thing and they talked for a while
						</p>
					</div>
				</div>
				<div className='tag-section'>
					<p>Faction</p>
					<div className='tag-section-fields'>
						<p className='tag-section-key'>Rank</p>
						<p className='tag-section-value'>New guy</p>
						<p className='tag-section-key'>Superior Officer</p>
						<p className='tag-section-value'>Billy</p>
						<p className='tag-section-key'>Introduction</p>
						<p className='tag-section-value'>
							This character met billy bob at the thing and they talked for a while
						</p>
					</div>
				</div>
			</div>
		</>
	);
};

export default RightNavTags;
