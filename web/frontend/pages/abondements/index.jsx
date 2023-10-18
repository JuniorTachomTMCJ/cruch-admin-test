import {
  Page,
  Layout,
  Grid,
  Form,
  Button,
  TextField,
  LegacyCard,
  FormLayout,
  Modal,
  IndexTable,
  useIndexResourceState,
  Text,
  EmptySearchResult,
  Link,
  Thumbnail,
  Frame,
  Loading,
  Select,
  Toast,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
  Pagination,
  Icon,
  Tooltip,
} from "@shopify/polaris";
import { ImageMajor, ExportMinor } from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';
import { utils, writeFileXLSX } from "xlsx";
export { utils, writeFileXLSX };

export default function AbondementsPage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const [abondements, setAbondements] = useState([]);
  const [filteredAbondements, setFilteredAbondements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [code, setCode] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const [salarie, setSalarie] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [addAbondement, setAddAbondement] = useState(false);

  const [activeOne, setActiveOne] = useState(false);
  const [message, setMessage] = useState("");
  const toggleActiveOne = useCallback(() => setActiveOne((activeOne) => !activeOne), []);
  const toastMarkup1 = activeOne ? (
    <Toast content={message} onDismiss={toggleActiveOne} />
  ) : null;

  const addAbondementModal = useCallback(
    () => setAddAbondement(!addAbondement),
    [addAbondement]
  );

  const handleAbondementFormSubmit = useCallback(async () => {
    if (code != "" && initialValue != "" && salarie != "") {
      await fetch(`https://staging.api.creuch.fr/api/create_code_reduction`, {
        method: "POST",
        body: JSON.stringify({
          matricule: code,
          amount: initialValue,
          customer: salarie,
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setMessage("Ajout d'abondement effectué avec succès.");
          fetchData();
        })
        .catch((error) => {
          console.error("Erreur d'ajout de l'abondement :", error);
          setMessage("Erreur d'ajout de l'abondement.");
        });
  
      addAbondementModal();
    } else {
      setMessage("Veuillez remplir les champs.");
    }
    toggleActiveOne();
  }, [code, initialValue, salarie]);

  function formatDateTime(dateTimeString) {
    const inputDate = new Date(dateTimeString);
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC", // Assuming input time is in UTC
    };
    return new Intl.DateTimeFormat("fr-FR", options).format(inputDate);
  }

  const resourceName = {
    singular: "Abondement",
    plural: "Abondements",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(abondements);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucun abondement trouvé"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  const rowMarkup = filteredAbondements.map(
    (
      {
        id,
        note,
        created_at,
        customer,
        initial_value,
        balance,
        currency,
      },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Link
            dataPrimaryLink
            url={`/abondements/${id}`}
            monochrome
            removeUnderline
          >
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {note}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{formatDateTime(created_at)}</IndexTable.Cell>
        <IndexTable.Cell>
          {customer.firstName} {customer.lastName}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {initial_value} {currency}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {initial_value - balance} {currency}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {balance} {currency}
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const exportToExcel = async () => {
    const tableau = filteredAbondements.map((abondement, index) => {
      return {
        Code: abondement.note,
        "Date Création": formatDateTime(abondement.created_at),
        Employé:
          abondement.customer.firstName + " " + abondement.customer.lastName,
        Montant: abondement.initial_value + " " + abondement.currency,
        Utilisé:
          abondement.initial_value -
          abondement.balance +
          " " +
          abondement.currency,
        Disponible: abondement.balance + " " + abondement.currency,
      };
    });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(tableau);
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFileXLSX(wb, "Abondements.xlsx");
  };

  const bulkActions = [
    {
      content: "Désactiver les abondements",
      onAction: () => console.log("Todo: implement bulk remove tags"),
    }
  ];

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
    { label: "Code", value: "note asc", directionLabel: "A-Z" },
    { label: "Code", value: "note desc", directionLabel: "Z-A" },
    { label: "Date création", value: "date asc", directionLabel: "A-Z" },
    { label: "Date création", value: "date desc", directionLabel: "Z-A" },
    { label: "Salarié", value: "client asc", directionLabel: "A-Z" },
    { label: "Salarié", value: "client desc", directionLabel: "Z-A" },
    { label: "Montant", value: "initial_value asc", directionLabel: "Croissant" },
    { label: "Montant", value: "initial_value desc", directionLabel: "Décroissant" },
    { label: "Disponible", value: "balance asc", directionLabel: "Croissant" },
    { label: "Disponible", value: "balance desc", directionLabel: "Décroissant" },
    { label: "Utilisé", value: "utilise asc", directionLabel: "Croissant" },
    { label: "Utilisé", value: "utilise desc", directionLabel: "Décroissant" },
  ];
  const [sortSelected, setSortSelected] = useState(["note asc"]);
  const handleSortSelected = useCallback(
    (value) => {
      setSortSelected(value);
      const [sortKey, sortDirection] = value[0].split(" ");
      const sortedOrders = [...filteredAbondements];
      switch (sortKey) {
        case "note":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.note.localeCompare(b.note);
            } else {
              return b.note.localeCompare(a.note);
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
        case "client":
          sortedOrders.sort((a, b) => {
            const nameA = `${a.customer.firstName} ${a.customer.lastName}`;
            const nameB = `${b.customer.firstName} ${b.customer.lastName}`;
            if (sortDirection === "asc") {
              return nameA.localeCompare(nameB);
            } else {
              return nameB.localeCompare(nameA);
            }
          });
          break;
        case "initial_value":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.initial_value - b.initial_value;
            } else {
              return b.initial_value - a.initial_value;
            }
          });
          break;
        case "balance":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.balance - b.balance;
            } else {
              return b.balance - a.balance;
            }
          });
          break;
        case "utilise":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return (a.initial_value - a.balance) - (b.initial_value - b.balance);
            } else {
              return (b.initial_value - b.balance) - (a.initial_value - a.balance);
            }
          });
          break;
        default:
          break;
      }
      setFilteredAbondements(sortedOrders);
    },
    [filteredAbondements]
  );

  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {
    setCse([]);
    setFilteredAbondements(abondements);
  };

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
  const [cse, setCse] = useState([]);

  const handleCseChange = useCallback(
    (value) => {
      setCse(value);
      const filteredAbondements = abondements.filter((abondement) => {
        if (value.length === 0) {
          return true;
        }
        return value.includes(
          String(
            abondement.customer ? abondement.customer.metafields[0].value : ""
          )
        );
      });

      setFilteredAbondements(filteredAbondements);
    },
    [abondements, filteredAbondements]
  );

  const handleCseRemove = useCallback(() => {
    setCse([]);
    setFilteredAbondements(abondements);
  }, [abondements]);

  const handleFiltersQueryChange = useCallback(
    (value) => {
      setQueryValue(value);
      const searchValueLower = value.toLowerCase();
      if (searchValueLower === "") {
        setFilteredAbondements(abondements);
      } else {
        const filteredAbondements = abondements.filter(
          (abondement) =>
            abondement.note.toLowerCase().includes(searchValueLower) ||
            `${abondement.customer.firstName} ${abondement.customer.lastName}`
              .toLowerCase()
              .includes(searchValueLower) ||
            abondement.balance
              .toString()
              .toLowerCase()
              .includes(searchValueLower) ||
            abondement.initial_value
              .toString()
              .toLowerCase()
              .includes(searchValueLower) ||
            (abondement.initial_value - abondement.balance)
              .toString()
              .toLowerCase()
              .includes(searchValueLower)
          // ||
          // (abondement.disabled_at &&
          //   abondement.disabled_at.toLowerCase().includes(searchValueLower))
        );
        setFilteredAbondements(filteredAbondements);
      }
    },
    [abondements]
  );

  const handleFiltersQueryClear = useCallback(() => {
    setQueryValue("");
    setFilteredAbondements(abondements);
  }, [abondements]);

  const filters = [
    {
      key: "cse",
      label: "CSE",
      filter: (
        <ChoiceList
          title="CSE"
          titleHidden
          choices={[
            ...entreprises.map((entreprise) => {
              return {
                label: entreprise.cse_name.value,
                value: entreprise.code_cse.value,
              };
            }),
          ]}
          selected={cse || []}
          onChange={handleCseChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  if (cse && !isEmpty(cse)) {
    const key = "cse";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, cse),
      onRemove: handleCseRemove,
    });
  }

  function disambiguateLabel(key, value) {
    let entrepriseLabels = {};

    entreprises.forEach((entreprise) => {
      entrepriseLabels[entreprise.code_cse.value] = entreprise.cse_name.value;
    });

    switch (key) {
      case "cse":
        return value
          .map((val) => entrepriseLabels[val] || "État inconnu")
          .join(", ");
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  }

  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const handleFiltersClearAll = useCallback(() => {
    handleQueryValueRemove();
    handleCseRemove();
  }, [handleQueryValueRemove, handleCseRemove]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [abondementsResponse, customersResponse, entreprisesResponse] =
          await Promise.all([
            fetch("https://staging.api.creuch.fr/api/get_gift_cards", {
              method: "POST",
              headers: {
                "Content-type": "application/json",
              },
            }),
            fetch("https://staging.api.creuch.fr/api/get_customers_by_cse", {
              method: "POST",
              headers: {
                "Content-type": "application/json",
              },
            }),
            fetch("https://staging.api.creuch.fr/api/entreprises", {
              method: "GET",
              headers: {
                "Content-type": "application/json",
              },
            }),
          ]);

        const [abondementsData, customersData, entreprisesData] =
          await Promise.all([
            abondementsResponse.json(),
            customersResponse.json(),
            entreprisesResponse.json(),
          ]);

        console.log("Abondements", abondementsData);
        console.log("Customers", customersData);
        console.log("Entreprises", entreprisesData);

        setAbondements(abondementsData);
        setFilteredAbondements(abondementsData);
        setCustomers(customersData);
        setEntreprises(entreprisesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  return (
    <Frame>
      <Page
        fullWidth
        backAction={{ content: "Tableau de bord", url: "/" }}
        title="Abondements"
        subtitle="Gérez les abondements de vos salariés"
        compactTitle
        primaryAction={{
          content: (
            <div style={{ display: "flex" }}>
              <Icon source={ExportMinor} color="base" /> Exporter
            </div>
          ),
          onAction: exportToExcel,
        }}
        secondaryActions={[
          {
            content: "Ajouter un abondement",
            onAction: addAbondementModal,
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
            open={addAbondement}
            onClose={addAbondementModal}
            title="Ajouter un abondement"
            primaryAction={{
              content: "Enregistrer",
              onAction: handleAbondementFormSubmit,
            }}
            secondaryActions={[
              {
                content: "Annuler",
                onAction: addAbondementModal,
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
                        label="Code de la carte-cadeau"
                        onChange={(value) => setCode(value)}
                        value={code}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <TextField
                        label="Valeur initiale"
                        type="number"
                        suffix="€"
                        onChange={(value) => setInitialValue(value)}
                        value={initialValue}
                        autoComplete="off"
                        required="on"
                      />
                    </Grid.Cell>

                    <Grid.Cell
                      columnSpan={{ xs: 6, sm: 6, md: 6, lg: 12, xl: 12 }}
                    >
                      <Select
                        label="Salariés"
                        options={[
                          ...customers.map((customer) => ({
                            label: customer.firstName + " " + customer.lastName,
                            value: customer.id.match(/\/(\d+)$/)[1],
                          })),
                        ]}
                        onChange={(value) => setSalarie(value)}
                        value={salarie}
                        required="on"
                      />
                    </Grid.Cell>
                  </Grid>
                </FormLayout>
              </Form>
            </Modal.Section>
          </Modal>
        </div>
        <Layout>
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
                filters={filters}
                appliedFilters={appliedFilters}
                onClearAll={handleFiltersClearAll}
                mode={mode}
                setMode={setMode}
              />
              <IndexTable
                resourceName={resourceName}
                itemCount={filteredAbondements.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                emptyState={emptyStateMarkup}
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: "Code" },
                  { title: "Date Création" },
                  { title: "Salarié" },
                  { title: "Montant" },
                  { title: "Utilisé" },
                  { title: "Disponible" },
                ]}
                bulkActions={bulkActions}
                onNavigation
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