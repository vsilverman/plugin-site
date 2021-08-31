
// import {graphql} from 'gatsby';
import React from 'react';
import querystring from 'querystring';
import PropTypes from 'prop-types';
import {navigate, useStaticQuery, graphql} from 'gatsby';
import fetch from 'isomorphic-fetch';
import algoliasearch from 'algoliasearch/lite';

import Layout from '../layout';
import forceArray from '../utils/forceArray';
import useFilterHooks from '../components/FiltersHooks';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Views from '../components/Views';
import SearchResults from '../components/SearchResults';
import SearchBox from '../components/SearchBox';
import Filters from '../components/Filters';
import ActiveFilters from '../components/ActiveFilters';
import SearchByAlgolia from '../components/SearchByAlgolia';

function groupBy(objectArray, property) {
    return objectArray.reduce((acc, obj) => {
        const key = obj[property];
        acc[key] = obj;
        return acc;
    }, {});
}

const useAlgolia = process.env.GATSBY_ALGOLIA_APP_ID && process.env.GATSBY_ALGOLIA_SEARCH_KEY;

const doSearch = (data, setResults, categoriesMap) => {
    const {query, sort} = data;
    const labels = forceArray(data.labels).concat(
        ...forceArray(data.categories).filter(Boolean).map(categoryId => categoriesMap[categoryId].labels)
    ).filter(Boolean);
    let page = data.page;
    setResults(null);
    if (useAlgolia) {
        const searchClient = algoliasearch(
            process.env.GATSBY_ALGOLIA_APP_ID,
            process.env.GATSBY_ALGOLIA_SEARCH_KEY
        );
        const index = searchClient.initIndex('Plugins');
        const filters = [];
        if (labels && labels.length) {
            filters.push(`(${labels.map(l => `labels:${l}`).join(' OR ')})`);
        }

        if (page === undefined || page === null) {
            page = 1;
        }

        index.search(
            query,
            {
                hitsPerPage: 50,
                page: page-1,
                filters: filters.join(' AND ')
            }
        ).then(({nbHits, page, nbPages, hits, hitsPerPage}) => {
            setResults({
                total: nbHits,
                pages: nbPages + 1,
                page: page + 1,
                limit: hitsPerPage,
                plugins: hits
            });
        });
    } else {
        const params = querystring.stringify({labels, page, q: query, sort});
        const url = `${process.env.GATSBY_API_URL || '/api'}/plugins?${params}`;
        fetch(url, {mode: 'cors'})
            .then((response) => {
                if (response.status >= 300 || response.status < 200) {
                    const error = new Error(response.statusText);
                    error.response = response;
                    throw error;
                }
                return response;
            })
            .then(response => response.json())
            .then(data => {
                data.plugins.forEach(p => p.developers = p.maintainers);
                data.pages = data.pages + 1;
                return data;
            })
            .then(setResults);
    }
};



function SearchPage({location}) {
    const [showFilter, setShowFilter] = React.useState(true);
    const [results, setResults] = React.useState(null);
    const categoriesMap = groupBy(useStaticQuery(graphql`
        query {
            categories: allJenkinsPluginCategory {
                edges {
                    node {
                        id
                        labels
                        title
                    }
                }
            }
        }
    `).categories.edges.map(edge => edge.node), 'id');
    const {
        sort, setSort,
        clearCriteria,
        categories, toggleCategory,
        labels, toggleLabel,
        view, setView,
        page, setPage,
        query, setQuerySilent, clearQuery,
        setData
    } = useFilterHooks({doSearch, setResults, categoriesMap});

    const handleOnSubmit = (e) => {
        const newData = {sort, categories, labels, view, page, query};
        e.preventDefault();
        navigate(`/ui/search?${querystring.stringify(newData)}`);
        doSearch(newData, setResults, categoriesMap);
    };

    const searchPage = 'templates/search.jsx';

    React.useEffect(() => {
        const qs = location.search.replace(/^\?/, '');
        const parsed = querystring.parse(qs);
        parsed.query = parsed.query || '';
        setData(parsed);
        doSearch(parsed, setResults, categoriesMap);
    }, []);

    return (
        <Layout id="searchpage" reportProblemRelativeSourcePath={searchPage} reportProblemUrl={`/ui/search?${querystring.stringify({query})}`} reportProblemTitle="Search">
            <SEO pathname={'/ui/search'} title="Search Results" />

            <div className="row d-flex">
                {showFilter && (<div className="col-md-3 order-last order-md-first">
                    <Filters
                        showFilter={showFilter}
                        showResults
                        sort={sort}
                        categories={categories}
                        labels={labels}
                        setSort={setSort}
                        clearCriteria={clearCriteria}
                        toggleCategory={toggleCategory}
                        toggleLabel={toggleLabel}
                    />
                </div>)}
                <div className={showFilter ? 'col-md-9' : 'offset-md-1 col-md-11'}>
                    <div className="row pt-4">
                        <div className={'col-md-9'}>
                            <SearchBox
                                showFilter={showFilter}
                                setShowFilter={setShowFilter}
                                query={query}
                                setQuery={setQuerySilent}
                                handleOnSubmit={handleOnSubmit}
                            />
                        </div>
                        <div className={'col-md-3'}>
                            <Views view={view} setView={setView} />
                        </div>
                    </div>
                    {!!useAlgolia && (
                        <div className="row">
                            <div className="col-md-12 text-center">
                                <SearchByAlgolia />
                            </div>
                        </div>
                    ) }
                    <div className="row">
                        <div className="col-md-12">
                            <ActiveFilters
                                activeCategories={categories}
                                activeLabels={labels}
                                activeQuery={query}
                                clearQuery={clearQuery}
                                toggleCategory={toggleCategory}
                                toggleLabel={toggleLabel}
                            />
                        </div>
                    </div>
                    <div className="view">
                        <div className="col-md-12">
                            <SearchResults
                                showFilter={showFilter}
                                showResults
                                view={view}
                                setPage={setPage}
                                results={results}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </Layout>
    );
}

SearchPage.propTypes = {
    location: PropTypes.object.isRequired
};

export default SearchPage;
