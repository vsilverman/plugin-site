import PropTypes from 'prop-types';
import React from 'react';

import {Link} from 'gatsby';

import {cleanTitle} from '../commons/helper';
import Icon from '../components/Icon';
import PluginLabels from '../components/PluginLabels';
import PluginDevelopers from '../components/PluginDevelopers';

function Developers({developers}) {
    return (
        <>
            <PluginDevelopers developers={developers.slice(0, 2)} />
            {developers.length > 2 && (
                <div key="more_developers">
                    {`(${developers.length - 2} other contributors)`}
                </div>
            )}
        </>
    );
}

Developers.propTypes = PluginDevelopers.propTypes;

function Plugin({plugin: {name, title, stats, requiredCore, labels, excerpt, developers}}) {
    return (
        <Link to={`/${name}/`} className="Plugin--PluginContainer">
            <div className="Plugin--IconContainer">
                <Icon title={title} />
            </div>
            <div className="Plugin--TitleContainer">
                <h4>{cleanTitle(title)}</h4>
            </div>
            <div className="Plugin--InstallsContainer">
                {'Installs:  '}
                {stats.currentInstalls}
            </div>
            <div className="Plugin--VersionContainer">
                <span className="jc">
                    <span className="j">Jenkins</span>
                    <span className="c">{`${requiredCore} +`}</span>
                </span>
            </div>
            <div className="Plugin--LabelsContainer">
                <PluginLabels labels={labels} />
            </div>
            <div className="Plugin--ExcerptContainer" dangerouslySetInnerHTML={{__html: excerpt}} />
            <div className="Plugin--AuthorsContainer">
                <Developers developers={developers} />
            </div>
        </Link>
    );
}

Plugin.propTypes = {
    plugin: PropTypes.shape({
        excerpt: PropTypes.string,
        labels: PropTypes.arrayOf(PropTypes.string),
        developers: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string
        })),
        name: PropTypes.string.isRequired,
        requiredCore: PropTypes.string,
        sha1: PropTypes.string,
        stats: PropTypes.shape({
            currentInstalls: PropTypes.number
        }).isRequired,
        title: PropTypes.string.isRequired,
        version: PropTypes.string,
        wiki: PropTypes.shape({
            url: PropTypes.string
        }).isRequire,
    }).isRequired
};

export default Plugin;
