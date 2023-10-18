import {
  Modal,
  Icon,
  Grid,
  Page,
  Text,
  Toast,
  FormLayout,
  TextField,
  Frame,
  TextContainer,
  Loading,
  LegacyCard,
  Popover,
  DatePicker,
  DropZone,
  Thumbnail,
  List,
  LegacyFilters,
  Button,
  ResourceList,
  ResourceItem,
  EmptyState,
  Scrollable,
} from "@shopify/polaris";
import {
  ImageMajor,
  NoteMinor,
} from "@shopify/polaris-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAuthenticatedFetch } from "../../hooks";

export default function OffreDetail() {
  const redirect = Redirect.create(useAppBridge());
  const user_cse = "INAN0023";

  const fetchQuery = useAuthenticatedFetch();
  const { handle } = useParams();
  const [collection, setCollection] = useState({});
  const [subCollections, setSubCollections] = useState([]);
  const [filteredSubCollections, setFilteredSubCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productsAll, setProductsAll] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState(null);
  const [selectedDate1, setSelectedDate1] = useState(new Date());
  const [selectedDate2, setSelectedDate2] = useState(new Date());
  
  const [alert, setAlert] = useState(false);
  const [activeOne, setActiveOne] = useState(false);
  const [message, setMessage] = useState("");
  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [addProductModal, setAddProductModal] = useState(false);
  const [addSubCollectionModal, setAddSubCollectionModal] = useState(false);

  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItemsAll, setSelectedItemsAll] = useState([]);
  const [selectedSubCollections, setSelectedSubCollections] = useState([]);
  const [selectedSubCollectionsAll, setSelectedSubCollectionsAll] = useState([]);
  const [sortValue, setSortValue] = useState("DATE_MODIFIED_DESC");
  const [queryValue, setQueryValue] = useState(undefined);
  const [queryValueSub, setQueryValueSub] = useState(undefined);
  
  const toggleActiveOne = useCallback(
      () => setActiveOne((activeOne) => !activeOne),
      []
  );
  const handleAlert = useCallback(() => setAlert(!alert), [alert]);
  const handleAddProductModal = useCallback(() => setAddProductModal(!addProductModal), [addProductModal]);
  const handleAddSubCollectionModal = useCallback(() => setAddSubCollectionModal(!addSubCollectionModal), [addSubCollectionModal]);

  const toastMarkup1 = activeOne ? (
      <Toast content={message} onDismiss={toggleActiveOne} />
  ) : null;

  const [{ month1, year1 }, setDate1] = useState({
    month1: selectedDate1.getMonth(),
    year1: selectedDate1.getFullYear(),
  });
  const [{ month2, year2 }, setDate2] = useState({
    month2: selectedDate2.getMonth(),
    year2: selectedDate2.getFullYear(),
  });

  function handleOnClose1({ relatedTarget }) {setVisible1(false);}
  function handleMonthChange1(month1, year1) {setDate1({ month1, year1 });}
  function handleDateSelection1({ end: newSelectedDate }) {
      setSelectedDate1(newSelectedDate);
      setVisible1(false);
  }

  function handleOnClose2({ relatedTarget }) {setVisible2(false);}
  function handleMonthChange2(month2, year2) {setDate2({ month2, year2 });}
  function handleDateSelection2({ end: newSelectedDate }) {
    setSelectedDate2(newSelectedDate);
    setVisible2(false);
  }
  
  const handleEditCollection = useCallback(async () => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        console.log(base64String);
        fetch(`https://staging.api.creuch.fr/api/edit_collection_by_id`, {
          method: "POST",
          body: JSON.stringify({
            id: handle,
            title: title,
            slug: slug,
            description: description,
            startDate: selectedDate1,
            endDate: selectedDate2,
            entrepriseId: user_cse,
            image: base64String,
          }),
          headers: { "Content-type": "application/json" },
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data)
            setMessage("Modification de l'offre effectuer avec succès.");
          })
          .catch((error) => {
            console.error("Erreur de modification de l'offre :", error);
            setMessage("Erreur de modification de l'offre.");
          });
      };
      reader.readAsDataURL(file);
    } else {
      await fetch(`https://staging.api.creuch.fr/api/edit_collection_by_id`, {
        method: "POST",
        body: JSON.stringify({
          id: handle,
          title: title,
          slug: slug,
          description: description,
          startDate: selectedDate1,
          endDate: selectedDate2,
          entrepriseId: user_cse,
          image: "",
        }),
        headers: { "Content-type": "application/json" },
      })
        .then((response) => response.json())
        .then(() => {
          setMessage("Modification de l'offre effectuer avec succès.");
        })
        .catch((error) => {
          console.error("Erreur de modification de l'offre :", error);
          setMessage("Erreur de modification de l'offre.");
        });
    }
    toggleActiveOne();
  }, [handle, title, description, slug, selectedDate1, selectedDate2, file]);

  const handleDeleteCollection = useCallback(async () => {
    await fetch(`https://staging.api.creuch.fr/api/delete_collection_by_id`, {
      method: "POST",
      body: JSON.stringify({id: handle}),
      headers: { "Content-type": "application/json" },
    })
      .then((response) => response.json())
      .then(() => {
        redirect.dispatch(Redirect.Action.APP, "/offres");
      })
      .catch((error) => {
        console.error("Erreur de suppression de l'offre :", error);
        setMessage("Erreur de suppression de l'offre.");
        toggleActiveOne();
      });
  }, [handle]);

  const handleDeleteCollectionImage = useCallback(async () => {
    await fetch(`https://staging.api.creuch.fr/api/remove_collection_image`, {
      method: "POST",
      body: JSON.stringify({
        id: handle,
        updated_at: new Date()
      }),
      headers: { "Content-type": "application/json" },
    })
      .then((response) => response.json())
      .then(() => {
        setMessage("Image supprimer avec succès.");
        setFile(null);
      })
      .catch((error) => {
        console.error("Erreur de suppression de l'image :", error);
        setMessage("Erreur de suppression de l'image.");
      });
      toggleActiveOne();
  }, [handle]);

  const handleAddProduct = useCallback(async () => {
    setIsLoading(true);
    selectedItemsAll.forEach(async (product_id) => {
      await fetch(
        `https://staging.api.creuch.fr/api/add_product_to_collection`,
        {
          method: "POST",
          body: JSON.stringify({
            collection_id: "gid://shopify/Collection/" + handle,
            product_id: "gid://shopify/Product/" + product_id,
          }),
          headers: {
            "Content-type": "application/json"
          },
        }
      )
        .then((response) => response.json())
        .then(() => {
          setSelectedItemsAll([]);
          fetchData();
          handleAddProductModal();
          setMessage("Produits ajoutés au collection avec succès");
          toggleActiveOne();
        })
        .catch((error) => {
          setMessage("Erreur d'ajout de produit au collection.");
          toggleActiveOne();
        });
    });
  }, [selectedItemsAll, handle]);

  const handleAddSubCollection = useCallback(async () => {
    setIsLoading(true);
    selectedSubCollectionsAll.forEach(async (sub_collection_id) => {
      await fetch(
        `https://staging.api.creuch.fr/api/add_sub_collection_to_collection`,
        {
          method: "POST",
          body: JSON.stringify({
            collection_id: "gid://shopify/Collection/" + handle,
            sub_collection_id: sub_collection_id,
          }),
          headers: {
            "Content-type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then(() => {
          setSelectedSubCollectionsAll([]);
          fetchData();
          handleAddSubCollectionModal();
          setMessage("Sous collection ajoutés au collection avec succès");
          toggleActiveOne();
        })
        .catch((error) => {
          setMessage("Erreur d'ajout de sous collection à la collection.");
          toggleActiveOne();
        });
    });
  }, [selectedSubCollectionsAll, handle]);

  const handleRemoveSubCollection = useCallback(async (value) => {
    setIsLoading(true);
    await fetch(
      `https://staging.api.creuch.fr/api/remove_sub_collection_to_collection`,
      {
        method: "POST",
        body: JSON.stringify({
          sub_collection_id: value,
        }),
        headers: {
          "Content-type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then(() => {
        fetchData();
        setMessage("Sous collection retiré du collection avec succès");
        toggleActiveOne();
      })
      .catch((error) => {
        setMessage("Erreur d'ajout de sous collection à la collection.");
        toggleActiveOne();
      });
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [collectionResponse, productsAllResponse, collectionsResponse] = await Promise.all([
        fetch(`https://staging.api.creuch.fr/api/get_collection_by_id`, {
          method: "POST",
          body: JSON.stringify({ id: handle, entreprise_id: user_cse }),
          headers: { "Content-type": "application/json" },
        }),
        fetchQuery("/api/products"),
        fetch("https://staging.api.creuch.fr/api/get_entreprise_collections", {
          method: "POST",
          body: JSON.stringify({
            entreprise_id: user_cse,
          }),
          headers: {
            "Content-type": "application/json",
          },
        })
      ]);

      const [collectionData, productsAllData, collectionsData] = await Promise.all([
        collectionResponse.json(),
        productsAllResponse.json(),
        collectionsResponse.json(),
      ]);

      console.log("Collection", collectionData);
      console.log("Products All", productsAllData.data);
      console.log("Collections", collectionsData);

      if (collectionData.collection && !collectionData.collection.errors) {
        let collection = collectionData.collection;
        setCollection(collection);
        setTitle(collection.title);
        setDescription(collection.body_html);
        setSlug(collection.handle);
        if (collection.metafields && collection.metafields.lenght > 2) {
          setSelectedDate1(new Date(collection.metafields[0].value));
          setSelectedDate2(new Date(collection.metafields[1].value));
        } else {
          setMessage("Erreur d'affichage des dates");
          toggleActiveOne();
        }
        if (collection.image) {
          fetch(collection.image.src)
            .then((response) => response.blob())
            .then((blob) => {
              setFile(
                new File([blob], collection.image.alt, {
                  type: "image/jpeg",
                })
              );
            })
            .catch((error) => {
              console.error(
                "Une erreur s'est produite lors du chargement de l'image :",
                error
              );
            });
        }
        setProducts(collection.products);
        setFilteredProducts(collection.products);
        setProductsAll(productsAllData.data.filter((produit) => {
          return !collection.products.some(
            (collectionProduit) => collectionProduit.id === produit.id
          );
        }));
        setCollections(
          collectionsData.filter((collectionData) => {
            return !collection.sub_collections.some(
              (sub_collection) => sub_collection.id === collectionData.id
            );
          })
        );
        setSubCollections(collection.sub_collections);
        setFilteredSubCollections(collection.sub_collections);
      } else {
        redirect.dispatch(Redirect.Action.APP, "/offres");
      }
    } catch (error) {
      console.error(
        "Erreur de chargement des détails de la collection :",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    fetchData();
    if (selectedDate1) {
      setDate1({
        month1: selectedDate1.getMonth(),
        year1: selectedDate1.getFullYear(),
      });
    }
    if (selectedDate2) {
      setDate2({
        month2: selectedDate2.getMonth(),
        year2: selectedDate2.getFullYear(),
      });
    }
  }, [selectedDate1, selectedDate2, handle]);

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) =>
      setFile(acceptedFiles[0]),
    []
  );
    
  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];

  const fileUpload = !file && (<DropZone.FileUpload actionHint="Accepts .gif, .jpg, and .png" />);
  const uploadedFile = file && (validImageTypes.includes(file.type) ? (
    <img
      src={window.URL.createObjectURL(file)}
      alt={file.name}
      style={{
        bottom: 0,
        display: "block",
        left: 0,
        margin: "auto",
        maxHeight: "100%",
        maxWidth: "100%",
        position: "absolute",
        right: 0,
        top: 0,
      }}
    />
  ) : (
    <Thumbnail size="large" alt={file.name} source={NoteMinor} />
  ));

  const handleQueryValueChange = useCallback((value) => {
    setQueryValue(value);
    const searchValueLower = value.toLowerCase();
    if (searchValueLower === "") {
      setFilteredProducts(products);
    } else {
      const filteredProducts = products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchValueLower) ||
          product.body_html.toLowerCase().includes(searchValueLower) ||
          product.product_type.toLowerCase().includes(searchValueLower)
      );
      setFilteredProducts(filteredProducts);
    }
  }, [products]);
  const handleQueryValueRemove = useCallback(() => {
    setQueryValue("");
    setFilteredProducts(products);
  }, [products]);

  const handleQueryValueSubChange = useCallback(
    (value) => {
      setQueryValueSub(value);
      const searchValueLower = value.toLowerCase();
      if (searchValueLower === "") {
        setFilteredSubCollections(subCollections);
      } else {
        const filteredSubCollections = subCollections.filter(
          (subCollection) =>
            subCollection.title.toLowerCase().includes(searchValueLower) ||
            subCollection.description.toLowerCase().includes(searchValueLower)
        );
        setFilteredSubCollections(filteredSubCollections);
      }
    },
    [subCollections]
  );
  const handleQueryValueSubRemove = useCallback(() => {
    setQueryValueSub("");
    setFilteredSubCollections(subCollections);
  }, [subCollections]);
  
  const handleClearAll = useCallback(() => {
    handleQueryValueRemove();
  }, [handleQueryValueRemove]);
  const handleClearAllSub = useCallback(() => {
    handleQueryValueSubRemove();
  }, [handleQueryValueSubRemove]);

  const handleSortSelected = useCallback(
    (value) => {
      setSortValue(value);
      const sortedOrders = [...filteredProducts];

      switch (value) {
        case "ALPHA_ASC":
          sortedOrders.sort((a, b) => {
            return a.title.localeCompare(b.title);
          });
          break;
        case "ALPHA_DESC":
          sortedOrders.sort((a, b) => {
            return b.title.localeCompare(a.title);
          });
          break;
        // case "PRICE_DESC":
        //   sortedOrders.sort((a, b) => {
        //     return b.total_price - a.total_price;
        //   });
        //   break;
        // case "PRICE_ASC":
        //   sortedOrders.sort((a, b) => {
        //     return a.total_price - b.total_price;
        //   });
          break;
        default:
          break;
      }
      setFilteredProducts(sortedOrders);
    },
    [filteredProducts]
  );

  const promotedBulkActions = [
    {
      content: "Modifier les produits",
      onAction: () => console.log("Todo: implement bulk edit"),
    },
  ];

  const bulkActions = [
    {
      content: "Supprimer les produits",
      onAction: () => console.log("Todo: implement bulk delete"),
    },
  ];

  const bulkActionsSubCollections = [
    {
      content: "Supprimer les sous collections",
      onAction: () => console.log("Todo: implement bulk delete"),
    },
  ];

  const filterControl = (
    <LegacyFilters
      queryValue={queryValue}
      queryPlaceholder="Recherchez dans les produits ..."
      filters={[]}
      appliedFilters={[]}
      onQueryChange={handleQueryValueChange}
      onQueryClear={handleQueryValueRemove}
      onClearAll={handleClearAll}
    >
      <div style={{ paddingLeft: "8px" }}>
        <Button onClick={() => handleAddProductModal()}>Parcourir</Button>
      </div>
    </LegacyFilters>
  );

  const filterControlSub = (
    <LegacyFilters
      queryValue={queryValueSub}
      queryPlaceholder="Recherchez dans les sous catégories ..."
      filters={[]}
      appliedFilters={[]}
      onQueryChange={handleQueryValueSubChange}
      onQueryClear={handleQueryValueSubRemove}
      onClearAll={handleClearAllSub}
    >
      <div style={{ paddingLeft: "8px" }}>
        <Button onClick={() => handleAddSubCollectionModal()}>Parcourir</Button>
      </div>
    </LegacyFilters>
  );

  const emptyStateMarkup =
    !filteredProducts.length ? (
      <EmptyState
        heading="Ajouter un produit pour commencer"
        action={{ content: "Ajouter des produits", onAction: handleAddProductModal }}
        image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
      >
        <p>
          Cette collection ne comporte aucun produit. Recherchez ou parcourez
          pour ajouter des produits.
        </p>
      </EmptyState>
    ) : undefined;
  
  const emptyStateMarkupSubCategory =
    !filteredSubCollections.length ? (
      <EmptyState
        heading="Ajouter une sous collection pour commencer"
        action={{
          content: "Ajouter des sous collections",
          onAction: handleAddSubCollectionModal,
        }}
        image="https://cdn.shopify.com/s/files/1/2376/3301/products/emptystate-files.png"
      >
        <p>
          Cette collection ne comporte aucune sous collection. Recherchez ou parcourez
          pour ajouter des sous collection.
        </p>
      </EmptyState>
    ) : undefined;

  return (
    <Frame>
      <Page
        fullWidth
        backAction={{ content: "Offres CSE", url: "/offres" }}
        title={`${collection.title}`}
        compactTitle
        primaryAction={{
          content: "Enregistrer",
          onAction: () => handleEditCollection(),
        }}
        actionGroups={[
          {
            title: "Autres actions",
            actions: [
              {
                content: <Text color="critical">Supprimer la collection</Text>,
                onAction: () => handleAlert(),
              },
            ],
          },
        ]}
      >
        <div>
          <Modal open={isLoading} loading small></Modal>
          <style>
            {`
            .Polaris-Modal-CloseButton { 
              display: none;
            }
            .Polaris-Modal-Dialog__Modal.Polaris-Modal-Dialog--sizeSmall {
              max-width: 5rem;
            }
            .Polaris-HorizontalStack {
              --pc-horizontal-stack-gap-xs: var(--p-space-0) !important;
            }
          `}
          </style>
        </div>
        <div>
          <Modal
            open={addProductModal}
            onClose={handleAddProductModal}
            title="Ajouter produits"
            primaryAction={{
              content: "Ajouter",
              onAction: handleAddProduct,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: handleAddProductModal,
              },
            ]}
          >
            <Modal.Section>
              <Scrollable shadow style={{ height: "300px" }} focusable>
                <ResourceList
                  resourceName={{ singular: "produit", plural: "produits" }}
                  items={productsAll}
                  renderItem={(item) => {
                    const { id, title, image } = item;
                    return (
                      <ResourceItem
                        id={id}
                        // url={`/products/${id}`}
                        media={<Thumbnail source={image.src} alt={image.alt} />}
                      >
                        <div style={{ display: "inline-flex" }}>{title}</div>
                      </ResourceItem>
                    );
                  }}
                  selectedItems={selectedItemsAll}
                  onSelectionChange={setSelectedItemsAll}
                  selectable
                />
              </Scrollable>
            </Modal.Section>
          </Modal>
        </div>
        <div>
          <Modal
            open={addSubCollectionModal}
            onClose={handleAddSubCollectionModal}
            title="Ajouter sous collections"
            primaryAction={{
              content: "Ajouter",
              onAction: handleAddSubCollection,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: handleAddSubCollectionModal,
              },
            ]}
          >
            <Modal.Section>
              <Scrollable shadow style={{ height: "300px" }} focusable>
                <ResourceList
                  resourceName={{
                    singular: "sous collection",
                    plural: "sous collections",
                  }}
                  items={collections}
                  renderItem={(item) => {
                    const { id, title, image } = item;
                    return (
                      <ResourceItem
                        id={id}
                        // url={`/offres/${id}`}
                        media={
                          <Thumbnail
                            source={image ? image.url : ImageMajor}
                            alt={image ? image.altText : ""}
                          />
                        }
                      >
                        <div style={{ display: "inline-flex" }}>{title}</div>
                      </ResourceItem>
                    );
                  }}
                  selectedItems={selectedSubCollectionsAll}
                  onSelectionChange={setSelectedSubCollectionsAll}
                  selectable
                />
              </Scrollable>
            </Modal.Section>
          </Modal>
        </div>
        <div>
          <Modal
            open={alert}
            onClose={handleAlert}
            title={`Supprimer la collection ${collection.title}`}
            primaryAction={{
              content: "Oui",
              onAction: () => handleDeleteCollection(),
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: handleAlert,
              },
            ]}
          >
            <Modal.Section>
              <TextContainer>
                <p>
                  Êtes-vous sûr de vouloir supprimer la collection{" "}
                  <strong>{collection.title}</strong> ?
                </p>
              </TextContainer>
            </Modal.Section>
          </Modal>
        </div>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
            <LegacyCard>
              <LegacyCard.Section>
                <FormLayout>
                  <TextField
                    label="Titre"
                    onChange={(value) => setTitle(value)}
                    value={title}
                    placeholder="Entrez le titre"
                    autoComplete="off"
                  />
                  <TextField
                    label="Description"
                    onChange={(value) => setDescription(value)}
                    value={description}
                    placeholder="Entrez la description"
                    multiline={4}
                    autoComplete="off"
                  />
                  <TextField
                    label="Slug"
                    onChange={(value) => setSlug(value)}
                    value={slug}
                    placeholder="Entrez le slug"
                    autoComplete="off"
                    maxLength={70}
                    showCharacterCount
                    prefix="https://creuch-shop.myshopify.com/collections/"
                  />

                  {/* <Popover
                    active={visible1}
                    autofocusTarget="none"
                    preferredAlignment="left"
                    fullWidth
                    preferInputActivator={false}
                    preferredPosition="below"
                    preventCloseOnChildOverlayClick
                    onClose={handleOnClose1}
                    activator={
                      <TextField
                        role="combobox"
                        label={"Date début"}
                        prefix={<Icon source={CalendarMinor} />}
                        value={selectedDate1.toISOString().slice(0, 10)}
                        onFocus={() => setVisible1(true)}
                        autoComplete="off"
                      />
                    }
                  >
                    <LegacyCard>
                      <DatePicker
                        month1={month1}
                        year1={year1}
                        selected={selectedDate1}
                        onMonthChange={handleMonthChange1}
                        onChange={handleDateSelection1}
                      />
                    </LegacyCard>
                  </Popover>

                  <Popover
                    active={visible2}
                    autofocusTarget="none"
                    preferredAlignment="left"
                    fullWidth
                    preferInputActivator={false}
                    preferredPosition="below"
                    preventCloseOnChildOverlayClick
                    onClose={handleOnClose2}
                    activator={
                      <TextField
                        role="combobox"
                        label={"Date fin"}
                        prefix={<Icon source={CalendarMinor} />}
                        value={selectedDate2.toISOString().slice(0, 10)}
                        onFocus={() => setVisible2(true)}
                        autoComplete="off"
                      />
                    }
                  >
                    <LegacyCard>
                      <DatePicker
                        month2={month2}
                        year2={year2}
                        selected={selectedDate2}
                        onMonthChange={handleMonthChange2}
                        onChange={handleDateSelection2}
                      />
                    </LegacyCard>
                  </Popover> */}
                </FormLayout>
              </LegacyCard.Section>
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
            <LegacyCard
              sectioned
              actions={[
                {
                  content: <Text color="critical">Retirer l'image</Text>,
                  onAction: handleDeleteCollectionImage,
                },
              ]}
            >
              <DropZone
                allowMultiple={false}
                onDrop={handleDropZoneDrop}
                accept="image/*"
                type="image"
                label="Image"
              >
                {uploadedFile}
                {fileUpload}
              </DropZone>
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <LegacyCard>
              <ResourceList
                emptyState={emptyStateMarkup}
                resourceName={{ singular: "produit", plural: "produits" }}
                items={filteredProducts}
                renderItem={(item) => {
                  const { id, title, image } = item;
                  return (
                    <ResourceItem
                      id={id}
                      // url={`/products/${id}`}
                      media={<Thumbnail source={image.src} alt={image.alt} />}
                      accessibilityLabel={`Voir les détails du ${title}`}
                      shortcutActions={[
                        {
                          content: <Text color="critical">Retirer</Text>,
                          onAction: async () => {
                            await fetch(
                              `https://staging.api.creuch.fr/api/remove_product_to_collection`,
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  collection_id:
                                    "gid://shopify/Collection/" + handle,
                                  product_id: "gid://shopify/Product/" + id,
                                }),
                                headers: { "Content-type": "application/json" },
                              }
                            )
                              .then((response) => response.json())
                              .then(() => {
                                setMessage(
                                  "Produit retiré de la collection avec succès"
                                );
                                toggleActiveOne();
                                fetchData();
                              })
                              .catch(() => {
                                setMessage(
                                  "Erreur de retrait du produit de la collection."
                                );
                                toggleActiveOne();
                              });
                          },
                        },
                      ]}
                      persistActions
                    >
                      <Text variant="bodyMd" as="a">
                        {title}
                      </Text>
                    </ResourceItem>
                  );
                }}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                promotedBulkActions={promotedBulkActions}
                bulkActions={bulkActions}
                sortValue={sortValue}
                sortOptions={[
                  {
                    label: "Titre des produits de A à Z",
                    value: "ALPHA_ASC",
                  },
                  {
                    label: "Titre des produits de Z à A",
                    value: "ALPHA_DESC",
                  },
                  // {
                  //   label: "Prix le plus élevé",
                  //   value: "PRICE_DESC",
                  // },
                  // {
                  //   label: "Prix le plus bas",
                  //   value: "PRICE_ASC",
                  // },
                ]}
                onSortChange={handleSortSelected}
                filterControl={filterControl}
              />
            </LegacyCard>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <LegacyCard>
              <ResourceList
                emptyState={emptyStateMarkupSubCategory}
                resourceName={{
                  singular: "sous collection",
                  plural: "sous collections",
                }}
                items={filteredSubCollections}
                renderItem={(item) => {
                  const { id, title, description, image } = item;
                  return (
                    <ResourceItem
                      id={id}
                      onClick={() => {
                        redirect.dispatch(
                          Redirect.Action.APP,
                          `/offres/${id.match(/\/(\d+)$/)[1]}`
                        );
                        return null;
                      }}
                      media={
                        <Thumbnail
                          source={image ? image.url : ImageMajor}
                          alt={image ? image.altText : ""}
                        />
                      }
                      accessibilityLabel={`Voir les détails du ${title}`}
                      shortcutActions={[
                        {
                          content: "Modifier",
                          onAction: () => {
                            redirect.dispatch(
                              Redirect.Action.APP,
                              `/offres/${id.match(/\/(\d+)$/)[1]}`
                            );
                            return null;
                          },
                        },
                        {
                          content: <Text color="critical">Retirer</Text>,
                          onAction: () =>
                            handleRemoveSubCollection(id.match(/\/(\d+)$/)[1]),
                        },
                      ]}
                      persistActions
                    >
                      <Text variant="bodyMd" as="h6">
                        {title}
                      </Text>
                      <br />
                      <Text variant="bodyMd" as="p">
                        {description}
                      </Text>
                    </ResourceItem>
                  );
                }}
                selectedItems={selectedSubCollections}
                onSelectionChange={setSelectedSubCollections}
                bulkActions={bulkActionsSubCollections}
                filterControl={filterControlSub}
              />
            </LegacyCard>
          </Grid.Cell>
        </Grid>
        {toastMarkup1}
      </Page>
    </Frame>
  );
}