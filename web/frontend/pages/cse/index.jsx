import {
  Page,
  Text,
  Link,
  Frame,
  Badge,
  Layout,
  Loading,
  LegacyCard,
  IndexTable,
  EmptySearchResult,
  useIndexResourceState,
  Thumbnail,
  Modal,
} from "@shopify/polaris";
import {
  ImageMajor,
} from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';

export default function CsePage() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  
  
  const [isLoading, setIsLoading] = useState(true);
  const [coops, setCoop] = useState([]);

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
      timeZone: "UTC",
    };
    return new Intl.DateTimeFormat("fr-FR", options).format(inputDate);
  }

  function getCSE(password, code){
    console.log("test ici". password);
    console.log("test ici 2". code);
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetch("https://staging.api.creuch.fr/api/entreprises", {
        method: "GET",
        headers: { "Content-type": "application/json" },
      })
        .then((response) => response.json())
        .then((object) => {
          console.log("Coops", object);
          setCoop(object);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err.message);
          //setErrorMessages({ name: "orders", message: err.message });
        });
    };

    fetchData();
  }, []);

  const resourceName = {singular: "Coop", plural: "Coops"};

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(coops);
  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={"Aucune Coop trouvé"}
      description={
        "Essayez de modifier les filtres ou les termes de recherche"
      }
      withIllustration
    />
  );

  const rowMarkup = coops.map(
    (
      {
        id,
        code_cse,
        address,
        phone,
        city,
        zip,
        cse_name,
        email,
        image,
        password,
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
          <Thumbnail
            source={image ? image.value : ImageMajor}
            alt={cse_name.value}
            size="small"
          />
        </IndexTable.Cell>
        <IndexTable.Cell>{code_cse.value}</IndexTable.Cell>
        <IndexTable.Cell>{cse_name.value}</IndexTable.Cell>
        <IndexTable.Cell>{email.value} </IndexTable.Cell>
        <IndexTable.Cell>{phone.value} </IndexTable.Cell>
        <IndexTable.Cell>
         
          <button onClick={ async () => {
            console.log("test");
            await fetch(`https://staging.api.creuch.fr/api/check_entreprise`, {
              method: "POST",
              body: JSON.stringify({
                code_cse: code_cse.value,
              }),
              headers: {
                "Content-type": "application/json",
              },
            })
            .then((response) => response.json())
            .then((data) => {
              console.log("oco", data);
              if (data.data.metaobjects.edges.length > 0) {
                if (data.data.metaobjects.edges[0].node.password.value === password.value) {
                  localStorage.setItem("user",JSON.stringify(data.data.metaobjects.edges[0].node));
                  console.log("connected", data.data.metaobjects.edges[0].node);
                  ///redirect.dispatch(Redirect.Action.APP, "/dashboard");
                  redirect.dispatch(Redirect.Action.ADMIN_PATH, '/apps/creuch_business/dashboard');
                } else {
                  //setErrorMessages({ name: "password", message: errors.password });
                  console.log("Mot de passe incorrect");
                }
              } else {
               /// setErrorMessages({ name: "code", message: errors.code });
                console.log("Code CSE incorrect");
              }
            })
            .catch((error) => {
             // console.log(error.message);
            }); 
          }
          }>    
          Connexion
          </button>
        
          </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const bulkActions = [
    {
      content: "Supprimer les commandes",
      onAction: () => console.log("Todo: implement bulk remove tags"),
    },
  ];

  // if (isLoading) {
  //   return (
  //     <div style={{ height: "100px" }}>
  //       <Frame>
  //         <Loading />
  //       </Frame>
  //     </div>
  //   );
  // }

  return (
    <Page
      fullWidth
      backAction={{ content: "Tableau de bord", url: "/dashboard" }}
      title="Liste des CSE"
      titleMetadata={<Badge status="success">{coops.length} CSE</Badge>}
      subtitle="Gérez les CSE"
      compactTitle
    >
      <div>
        <Modal open={isLoading} loading small></Modal>
      </div>
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <IndexTable
              resourceName={resourceName}
              itemCount={coops.length}
  /*             selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              } */
              emptyState={emptyStateMarkup}
             /*  onSelectionChange={handleSelectionChange} */
              headings={[
                { title: "Image" },
                { title: "Code" },
                { title: "Nom" },
                { title: "Email" },
                { title: "Téléphone" },
                { title: "Compte" },
              ]}
             /*  bulkActions={bulkActions} */
              // onNavigation
              // selectable
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
