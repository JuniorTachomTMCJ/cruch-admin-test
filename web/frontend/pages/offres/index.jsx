import {
  Icon,
  Page,
  Layout,
  Grid,
  Form,
  TextField,
  LegacyCard,
  FormLayout,
  Modal,
  Select,
  IndexTable,
  useIndexResourceState,
  Text,
  EmptySearchResult,
  Link,
  Toast,
  Frame,
  DatePicker,
  Popover,
  Thumbnail,
  Loading,
  Badge,
  Button,
  useSetIndexFiltersMode,
  IndexFilters,
  Pagination,
  Tooltip,
} from "@shopify/polaris";
import { CalendarMinor, ImageMajor, ExportMinor } from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { utils, writeFileXLSX } from "xlsx";
export { utils, writeFileXLSX };

export default function OffresPage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  

  const [select, setSelect] = useState('');
  const options = [];
  const [cse, setCse] = useState([]);


  const [offres, setOffres] = useState([]);
  const [filteredOffres, setFilteredOffres] = useState([]);
  const [addOffer, setAddOffer] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate1, setSelectedDate1] = useState(new Date());
  const [selectedDate2, setSelectedDate2] = useState(new Date());
  const [{ month1, year1 }, setDate1] = useState({
      month1: selectedDate2.getMonth(),
      year1: selectedDate2.getFullYear(),
  });
  const [{ month2, year2 }, setDate2] = useState({
      month2: selectedDate2.getMonth(),
      year2: selectedDate2.getFullYear(),
  });

  const formattedValue1 = selectedDate1.toISOString().slice(0, 10);
  const formattedValue2 = selectedDate2.toISOString().slice(0, 10);
  
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

  function handleInputValueChange1() {
    console.log("handleInputValueChange");
  }
  function handleInputValueChange2() {
    console.log("handleInputValueChange");
  }

  const [activeOne, setActiveOne] = useState(false);
  const [message, setMessage] = useState("");

  const toggleActiveOne = useCallback(() => setActiveOne((activeOne) => !activeOne), []);

  const toastMarkup1 = activeOne ? (
    <Toast content={message} onDismiss={toggleActiveOne} />
  ) : null;

  const addOfferModal = useCallback(() => setAddOffer(!addOffer), [addOffer]);

  const handleOffreFormSubmit = useCallback(async () => {
    await fetch(
      `https://staging.api.creuch.fr/api/create_entreprise_collection`,
      {
        method: "POST",
        body: JSON.stringify({
          title: title,
          description: description,
          startDate: selectedDate1,
          endDate: selectedDate2,
          entrepriseId: "",
        }),
        headers: { "Content-type": "application/json" },
      }
    )
      .then((response) => response.json())
      .then(() => {
        setMessage("Ajout d'adresse effectué avec succès.");
        fetchData();
      })
      .catch((error) => {
        console.error("Erreur d'ajout de l'offre :", error);
        setMessage("Erreur d'ajout de l'offre.");
      });

    toggleActiveOne();
    addOfferModal();
  }, [title, description, selectedDate1, selectedDate2]);


  const resourceName = {
      singular: "Offre",
      plural: "Offres",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(offres);

  const emptyStateMarkup = (
      <EmptySearchResult
      title={"Aucune offre trouvée"}
      description={"Essayez de modifier les filtres ou les termes de recherche"}
      withIllustration
      />
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Number of items to show per page

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedData = filteredOffres.slice(start, end);

  const rowMarkup = paginatedData.map(
    ({ id, title, description, image }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Link dataPrimaryLink url={`/offres/${id.match(/\/(\d+)$/)[1]}`}>
            <Thumbnail
              source={image ? image.url : ImageMajor}
              alt={title}
              size="small"
            />
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" fontWeight="semibold" as="span">
            {title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {description.length > 50
            ? `${description.substring(0, 50)}...`
            : description}
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const exportToExcel = async () => {
    const tableau = paginatedData.map((offre, index) => {
      return {
        Image: offre.image ? offre.image.url : "Aucun",
        Titre: offre.title,
        Description: offre.description
      };
    });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(tableau);
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFileXLSX(wb, "Offres.xlsx");
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState(["Toutes"]);
  const deleteView = (index) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: "rename",
              onAction: () => {},
              onPrimaryAction: async (value) => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: "duplicate",
              onPrimaryAction: async (value) => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: "edit",
            },
            {
              type: "delete",
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));
  const [selected, setSelected] = useState(0);
  const onCreateNewView = async (value) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  const sortOptions = [
    { label: "Titre", value: "titre asc", directionLabel: "A-Z" },
    { label: "Titre", value: "titre desc", directionLabel: "Z-A" },
    { label: "Description", value: "description asc", directionLabel: "A-Z" },
    { label: "Description", value: "description desc", directionLabel: "Z-A" }
  ];
  const [sortSelected, setSortSelected] = useState(["titre asc"]);
  const handleSortSelected = useCallback(
    (value) => {
      setSortSelected(value);
      const [sortKey, sortDirection] = value[0].split(" ");
      const sortedOrders = [...filteredOffres];

      switch (sortKey) {
        case "titre":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.title.localeCompare(b.title);
            } else {
              return b.title.localeCompare(a.title);
            }
          });
          break;
        case "description":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.description.localeCompare(b.description);
            } else {
              return b.description.localeCompare(a.description);
            }
          });
          break;
        case "date":
          sortedOrders.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            if (sortDirection === "asc") {
              return dateA - dateB;
            } else {
              return dateB - dateA;
            }
          });
          break;
        
        default:
          break;
      }

      setSortSelected(value);
      setFilteredOffres(sortedOrders);
    },
    [filteredOffres]
  );

  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {};

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction =
    selected === 0
      ? {
          type: "save-as",
          onAction: onCreateNewView,
          disabled: false,
          loading: false,
        }
      : {
          type: "save",
          onAction: onHandleSave,
          disabled: false,
          loading: false,
        };
  const [queryValue, setQueryValue] = useState("");

  const handleFiltersQueryChange = useCallback(
    (value) => {
      setQueryValue(value);
      const searchValueLower = value.toLowerCase();
      if (searchValueLower === "") {
        setFilteredOffres(offres);
      } else {
        const filteredOffres = offres.filter(
          (offre) =>
            offre.title.toLowerCase().includes(searchValueLower) ||
            offre.description.toLowerCase().includes(searchValueLower)
        );
        setFilteredOffres(filteredOffres);
      }
    },
    [offres]
  );

  const handleFiltersQueryClear = useCallback(() => {
    setQueryValue("");
    setFilteredOffres(offres);
  }, [offres]);

  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const handleFiltersClearAll = useCallback(() => { handleQueryValueRemove(); }, [handleQueryValueRemove]);

  
  const handleSelectChange = useCallback(
    async (value) => {
        console.log(value);
        setIsLoading(true);
        await fetch("https://staging.api.creuch.fr/api/get_entreprise_collections", {
          method: "POST",
          body: JSON.stringify({ entreprise_id: value }),
          headers: { "Content-type": "application/json" },
        })
          .then((response) => response.json())
          .then((datas) => {
            console.log("orders", datas);
            setOffres(datas);
            setFilteredOffres(datas);
            setIsLoading(false);
          })
          .catch((err) => {
            console.log(err.message);
          });
      }
    );
  
  
  
  const fetchData = async () => {
    setIsLoading(true);
    await fetch(
      "https://staging.api.creuch.fr/api/get_entreprise_collections",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        setOffres(data);
        setFilteredOffres(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });



      await fetch("https://staging.api.creuch.fr/api/entreprises", {
        method: "GET",
        headers: { "Content-type": "application/json" },
      })
        .then((response) => response.json())
        .then((datas) => {
          console.log("orders", datas);
          
          for (let i = 0; i < datas.length; i++) {
           // console.log("iiiiii", i)
            let item = {
              label : datas[i].cse_name.value,
              value : datas[i].code_cse.value
            }
            options.push(item);
          } 
          console.log("options", options);
          setCse(options);
        })
        .catch((err) => {
          console.log("erreur de chargement des entreprises");
        });
  };

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
  }, [selectedDate1, selectedDate2, itemStrings, selected]);

  return (
    <Frame>
      <Page
        fullWidth
        backAction={{ content: "Tableau de bord", url: "/dashboard" }}
        title="Offres CSE"
        titleMetadata={<Badge status="success">{offres.length} Offres</Badge>}
        subtitle="Gérez les collections de votre CSE"
        compactTitle
        secondaryActions={[
          {
            content: "Ajouter une offre",
            onAction: addOfferModal,
          },
        ]}
      >
        <div>
          <Modal open={isLoading} loading small></Modal>
        </div>
        <div>
          <Modal
            open={addOffer}
            onClose={addOfferModal}
            title="Ajouter une offre"
            primaryAction={{
              content: "Enregistrer",
              onAction: handleOffreFormSubmit,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: addOfferModal,
              },
            ]}
          >
            <Modal.Section>
              <Form>
                <FormLayout>
                  <Grid>
                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <TextField
                        label="Titre"
                        onChange={(value) => setTitle(value)}
                        value={title}
                        placeholder="Entrez le titre"
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <TextField
                        label="Description"
                        onChange={(value) => setDescription(value)}
                        value={description}
                        placeholder="Entrez la description"
                        multiline={4}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    {/* <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
                    >
                      <Popover
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
                            value={formattedValue1}
                            onFocus={() => setVisible1(true)}
                            onChange={handleInputValueChange1}
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
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 3, xl: 3 }}
                    >
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
                            value={formattedValue2}
                            onFocus={() => setVisible2(true)}
                            onChange={handleInputValueChange2}
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
                      </Popover>
                    </Grid.Cell> */}
                  </Grid>
                </FormLayout>
              </Form>
            </Modal.Section>
          </Modal>
        </div>
        <Layout>
          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 5, sm: 5, md: 5, lg: 11, xl: 11 }}>
                <Pagination
                  onPrevious={() => handlePageChange(currentPage - 1)}
                  onNext={() => handlePageChange(currentPage + 1)}
                  type="table"
                  hasNext={end < filteredOffres.length}
                  hasPrevious={currentPage > 1}
                  label={`${start}-${end} sur ${filteredOffres.length} offres`}
                />
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}>
                <Tooltip content="Exporter le tableau">
                  <Button onClick={exportToExcel} size="medium" primary>
                    <Icon source={ExportMinor} color="base" /> Exporter  ...
                  </Button>
                </Tooltip>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}>
                  <div style={{ display: "inline-flex", alignItems: "center" }}>
                    <div style={{ marginRight: "10px" }}>
                    <Select
                        label="Filtrer par CSE"
                        options={cse}
                        onChange={handleSelectChange}
                        value={select}
                      />
                    </div>
                  </div>
              </Grid.Cell>
            </Grid>
          </Layout.Section>
          <br />
          <Layout.Section>
            <LegacyCard>
              <IndexFilters
                sortOptions={sortOptions}
                sortSelected={sortSelected}
                onSort={handleSortSelected}
                queryValue={queryValue}
                queryPlaceholder="Recherchez dans tout les champs ..."
                onQueryChange={handleFiltersQueryChange}
                onQueryClear={handleFiltersQueryClear}
                primaryAction={primaryAction}
                cancelAction={{
                  onAction: onHandleCancel,
                  disabled: false,
                  loading: false,
                }}
                tabs={tabs}
                selected={selected}
                onSelect={setSelected}
                canCreateNewView
                onCreateNewView={onCreateNewView}
                filters={[]}
                appliedFilters={[]}
                onClearAll={handleFiltersClearAll}
                mode={mode}
                setMode={setMode}
              />
              <IndexTable
                resourceName={resourceName}
                itemCount={paginatedData.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                emptyState={emptyStateMarkup}
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: <Text visuallyHidden="true">Image</Text> },
                  { title: "Titre" },
                  { title: "Description" },
                ]}
                onNavigation
                selectable
              >
                {rowMarkup}
              </IndexTable>
            </LegacyCard>
          </Layout.Section>
        </Layout>
        {toastMarkup1}
      </Page>
    </Frame>
  );
}