import React, { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiShare2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { createCollection, deleteCollection, fetchCollections } from '../lib/apiClient';
import './CollectionsPage.css';

const CollectionsPage = ({ session }) => {
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCollection = useMemo(
    () => collections.find((item) => item.id === selectedCollectionId) || null,
    [collections, selectedCollectionId],
  );

  useEffect(() => {
    if (!session?.user?.id) {
      setCollections([]);
      setSelectedCollectionId(null);
      return;
    }

    let ignore = false;

    async function loadCollections() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const payload = await fetchCollections();
        if (ignore) return;
        const items = Array.isArray(payload?.items) ? payload.items : [];
        setCollections(items);
        setSelectedCollectionId((prev) => prev || items[0]?.id || null);
      } catch (error) {
        if (ignore) return;
        setErrorMessage(error.message || 'Unable to load collections.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadCollections();
    return () => {
      ignore = true;
    };
  }, [session?.user?.id]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const created = await createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
      });
      setCollections((prev) => [created, ...prev]);
      setSelectedCollectionId(created.id);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowNewCollectionForm(false);
      setStatusMessage('Collection created.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to create collection.');
    }
  };

  const handleDeleteCollection = async (id) => {
    try {
      await deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (selectedCollectionId === id) {
        const next = collections.find((item) => item.id !== id);
        setSelectedCollectionId(next?.id || null);
      }
      setStatusMessage('Collection deleted.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete collection.');
    }
  };

  const formatCreated = (createdAt) => {
    if (!createdAt) return 'Unknown';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (!session?.user?.id) {
    return (
      <div className="collections-page-neo">
        <div className="collections-container-neo">
          <header className="collections-header-neo">
            <h1 className="collections-title">My Collections</h1>
            <p className="collections-subtitle">Sign in to create, save, and manage collections.</p>
            <Link to="/auth" className="btn-primary-neo">Go to Sign In</Link>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="collections-page-neo">
      <div className="collections-container-neo">
        {/* Header */}
        <header className="collections-header-neo">
          <h1 className="collections-title">My Collections</h1>
          <p className="collections-subtitle">
            Save and organize your favorite AI tools
          </p>
          <button
            className="btn-primary-neo"
            onClick={() => setShowNewCollectionForm(true)}
          >
            <FiPlus size={18} /> Create Collection
          </button>
        </header>

        {/* New Collection Form */}
        {showNewCollectionForm && (
          <div className="new-collection-modal">
            <div className="form-content">
              <h2>Create New Collection</h2>
              <input
                type="text"
                className="form-input"
                placeholder="Collection name (e.g., Design Stack)"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                className="form-input"
                placeholder="Optional description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
              />
              <div className="form-actions">
                <button className="btn-primary-neo" onClick={handleCreateCollection}>
                  Create
                </button>
                <button
                  className="btn-secondary-neo"
                  onClick={() => setShowNewCollectionForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="collections-content">
          {/* Collections List */}
          <aside className="collections-sidebar">
            <h2 className="sidebar-title">Collections ({collections.length})</h2>
            {isLoading && <p className="loading-message">Loading collections...</p>}
            <div className="collections-list">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`collection-item ${
                    selectedCollectionId === collection.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCollectionId(collection.id)}
                >
                  <div className="item-info">
                    <h3 className="item-name">{collection.name}</h3>
                    <p className="item-count">{collection.tool_count || 0} tools</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Collection Details */}
          <main className="collections-main">
            {selectedCollection ? (
              <>
                <div className="collection-header">
                  <div>
                    <h2 className="collection-title">{selectedCollection.name}</h2>
                    <p className="collection-meta">
                      {selectedCollection.tool_count || 0} tools • Created {formatCreated(selectedCollection.created_at)}
                    </p>
                    {selectedCollection.description && (
                      <p className="collection-description">
                        {selectedCollection.description}
                      </p>
                    )}
                  </div>
                  <div className="collection-actions">
                    <button className="btn-icon" title="Share collection">
                      <FiShare2 size={18} />
                    </button>
                    <button className="btn-icon" title="Edit collection">
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      title="Delete collection"
                      onClick={() => handleDeleteCollection(selectedCollection.id)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="collection-tools">
                  {(selectedCollection.tool_count || 0) > 0 ? (
                    <div className="tools-display">
                      {(selectedCollection.tool_slugs || []).map((slug) => (
                        <div key={slug} className="tool-badge">
                          {slug}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <h3>No tools yet</h3>
                      <p>Add tools from the explore page to build this collection</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state empty-centered">
                <h3>No collection selected</h3>
                <p>Select a collection from the list to view its tools</p>
              </div>
            )}
          </main>
        </div>

        {statusMessage && <p className="status-message">{statusMessage}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default CollectionsPage;
