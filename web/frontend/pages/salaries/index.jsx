import {
  Modal,
  Page,
  Text,
  Link,
  Frame,
  Badge,
  Layout,
  Loading,
  TextField,
  LegacyCard,
  Form,
  Grid,
  FormLayout,
  IndexTable,
  EmptySearchResult,
  useIndexResourceState,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
  Icon,
} from "@shopify/polaris";
import { ImageMajor, ExportMinor } from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';
import { utils, writeFileXLSX } from "xlsx";
export { utils, writeFileXLSX };

export default function ClientsPage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entreprises, setEntreprises] = useState([]);

  const resourceName = {
    singular: "Employé CSE",
    plural: "Employés CSE",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(customers);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucun employés trouvés"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  const rowMarkup = filteredCustomers.map(
    (
      { id, firstName, lastName, email, phone, metafields, entreprise },
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
            url={`/salaries/${id.match(/\/(\d+)$/)[1]}`}
            monochrome
            removeUnderline
          >
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {metafields["1"]["value"]}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {lastName} {firstName}
        </IndexTable.Cell>
        <IndexTable.Cell>{email}</IndexTable.Cell>
        <IndexTable.Cell>{phone}</IndexTable.Cell>
        <IndexTable.Cell>{entreprise ? entreprise.cse_name.value : ""}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const exportToExcel = async () => {
    const tableau = filteredCustomers.map((customer, index) => {
      return {
        Matricule: customer.metafields["1"]["value"],
        "Nom et Prénoms": customer.lastName + " " + customer.firstName,
        Email: customer.email,
        "Numéro de Téléphone": customer.phone,
        "Code CSE": customer.entreprise ? customer.entreprise.cse_name.value : "",
      };
    });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(tableau);
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFileXLSX(wb, "Salariés.xlsx");
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
    actions: index === 0
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
    {
      label: "Numéro de matricule",
      value: "matricule asc",
      directionLabel: "Croissant",
    },
    {
      label: "Numéro de matricule",
      value: "matricule desc",
      directionLabel: "Décroissant",
    },
    { label: "Nom et prénoms", value: "name asc", directionLabel: "A-Z" },
    { label: "Nom et prénoms", value: "name desc", directionLabel: "Z-A" },
    { label: "Email", value: "email asc", directionLabel: "A-Z" },
    { label: "Email", value: "email desc", directionLabel: "Z-A" },
    { label: "Téléphone", value: "phone asc", directionLabel: "Croissant" },
    { label: "Téléphone", value: "phone desc", directionLabel: "Décroissant" },
    { label: "CSE", value: "code_cse asc", directionLabel: "Croissant" },
    { label: "CSE", value: "code_cse desc", directionLabel: "Décroissant" },
  ];
  const [sortSelected, setSortSelected] = useState(["matricule asc"]);
  const handleSortSelected = useCallback(
    (value) => {
      setSortSelected(value);
      const [sortKey, sortDirection] = value[0].split(" ");
      const sortedOrders = [...filteredCustomers];

      switch (sortKey) {
        case "matricule":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.metafields[1].value.localeCompare(b.metafields[1].value);
            } else {
              return b.metafields[1].value.localeCompare(a.metafields[1].value);
            }
          });
          break;
        case "name":
          sortedOrders.sort((a, b) => {
            const nameA = `${a.lastName}`;
            const nameB = `${b.lastName}`;
            if (sortDirection === "asc") {
              return nameA.localeCompare(nameB);
            } else {
              return nameB.localeCompare(nameA);
            }
          });
          break;
        case "email":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.email.localeCompare(b.email);
            } else {
              return b.email.localeCompare(a.email);
            }
          });
          break;
        case "phone":
          sortedOrders.sort((a, b) => {
            if (sortDirection === "asc") {
              return a.phone.localeCompare(b.phone);
            } else {
              return b.phone.localeCompare(a.phone);
            }
          });
          break;
        case "code_cse":
          sortedOrders.sort((a, b) => {
            let a_entreprise = a.entreprise ? a.entreprise.cse_name.value : "";
            let b_entreprise = b.entreprise ? b.entreprise.cse_name.value : "";
            if (sortDirection === "asc") {
              return a_entreprise.localeCompare(b_entreprise);
            } else {
              return b_entreprise.localeCompare(a_entreprise);
            }
          });
          break;
        default:
          break;
      }
      setFilteredCustomers(sortedOrders);
    },
    [filteredCustomers]
  );

  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {
    setQueryValue("");
    setFilteredCustomers(customers);
  };

  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  const primaryAction = selected === 0
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

  const handleCseChange = useCallback((value) => {
    setCse(value);
    const filteredCustomers = customers.filter((customer) => {
      if (value.length === 0) {
        return true;
      }
      return value.includes(
        String(customer.entreprise ? customer.entreprise.code_cse.value : "")
      );
    });

    setFilteredCustomers(filteredCustomers);
  }, [customers, filteredCustomers]);

  const handleCseRemove = useCallback(() => {
    setCse([]);
    setFilteredCustomers(customers);
  }, [customers]);

  const handleFiltersQueryChange = useCallback(
    (value) => {
      setQueryValue(value);
      const searchValueLower = value.toLowerCase();

      if (searchValueLower === "") {
        setFilteredCustomers(customers);
      } else {
        const filteredCustomers = customers.filter((customer) => {
          const email = String(customer.email).toLowerCase();
          const firstName = String(customer.firstName).toLowerCase();
          const lastName = String(customer.lastName).toLowerCase();
          const phone = String(customer.phone).toLowerCase();
          const metafields = customer.metafields.toString().toLowerCase();
          const entreprise = customer.entreprise ? JSON.stringify(customer.entreprise).toLowerCase() : "";

          return (
            email.includes(searchValueLower) ||
            firstName.includes(searchValueLower) ||
            lastName.includes(searchValueLower) ||
            phone.includes(searchValueLower) ||
            metafields.includes(searchValueLower) ||
            entreprise.includes(searchValueLower)
          );
        });

        setFilteredCustomers(filteredCustomers);
      }
    },
    [customers]
  );

  const handleFiltersQueryClear = useCallback(() => {
    setQueryValue("");
    var filteredCustomers = customers;
    if (cse.length >= 1) {
      filteredCustomers = filteredCustomers.filter((customer) => {
        if (cse.length === 0) {
          return true;
        }
        return cse.includes(
          String(customer.entreprise ? customer.entreprise.code_cse.value : "")
        );
      });
    }
    setFilteredCustomers(filteredCustomers);
  }, [customers]);

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

  const [addOffer, setAddOffer] = useState(false);
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
          entrepriseId: user_cse,
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
  }, []);

  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const handleFiltersClearAll = useCallback(() => {
    handleQueryValueRemove();
    handleCseRemove();
  }, [handleQueryValueRemove, handleCseRemove]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [customersResponse, entreprisesResponse] = await Promise.all([
          fetch("https://staging.api.creuch.fr/api/get_customers_by_cse", {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
          }),
          fetch("https://staging.api.creuch.fr/api/entreprises", {
            method: "GET",
            headers: { "Content-type": "application/json" },
          }),
        ]);

        const [customersData, entreprisesData] = await Promise.all([
          customersResponse.json(),
          entreprisesResponse.json()
        ]);
        console.log(customersData);
        setCustomers(customersData);
        setFilteredCustomers(customersData);
        setEntreprises(entreprisesData);
      } catch (error) {
        console.error("Erreur de chargement des détails de la collection :", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Page
      fullWidth
      backAction={{ content: "Tableau de bord", url: "/" }}
      title="Salariés CSE"
      titleMetadata={
        <Badge status="success">{customers.length} Salariés</Badge>
      }
      subtitle="Gérez tout les salariés"
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
          content: "Mettre à jour la base salariale",
          onAction: addOfferModal,
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
              itemCount={filteredCustomers.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              emptyState={emptyStateMarkup}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Matricule" },
                { title: "Nom et Prénoms" },
                { title: "Email" },
                { title: "Numéro de Téléphone" },
                { title: "CSE" },
              ]}
              onNavigation
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}