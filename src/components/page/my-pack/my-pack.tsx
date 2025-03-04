import { useMemo, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import s from './my-pack.module.scss'

import { Back, Edit, Play, SubMenu, Trash } from '@/assets'
import {
  AddEditCardModal,
  AddEditPackModal,
  DeletePackCardModal,
} from '@/components/page/common/modals'
import { MyPackTable } from '@/components/page/my-pack/my-pack-table/my-pack-table.tsx'
import {
  Button,
  DropDownMenuDemo,
  Pagination,
  SuperSelect,
  TextField,
  Typography,
} from '@/components/ui'
import { Loader } from '@/components/ui/loader/loader.tsx'
import { Sort } from '@/components/ui/table/type.ts'
import {
  useCreateCardMutation,
  useDeleteCardMutation,
  useEditCardMutation,
  useGetCardsQuery,
} from '@/services/cards'
import { useDeletedDeckMutation, useGetDeckQuery, useUpdateDeckMutation } from '@/services/decks'
import { deckSlice } from '@/services/decks/deck.slice.ts'
import {
  modalActions,
  NameModal,
  selectCardSettings,
  selectOpen,
  selectPackSettings,
} from '@/services/modal'
import { useAppDispatch, useAppSelector } from '@/services/store.ts'

export const MyPack = () => {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { privatePack, packName } = useAppSelector(selectPackSettings)
  const { question, answer, questionImg, answerImg } = useAppSelector(selectCardSettings)
  const itemsPerPage = useAppSelector(state => state.deckSlice.currentPerPageMyPack)
  const options = useAppSelector(state => state.deckSlice.paginationOptions)
  const currentPage = useAppSelector(state => state.deckSlice.currentPageMyPack)
  const open = useAppSelector(selectOpen)
  const dispatch = useAppDispatch()

  const [cardId, setCardId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>({ key: 'updated', direction: 'desc' })

  const sortedString = useMemo(() => {
    if (!sort) return null

    return `${sort.key}-${sort.direction}`
  }, [sort])

  const { data } = useGetDeckQuery({
    id: params.id,
  })
  const { data: dataCards, isLoading } = useGetCardsQuery({
    id: params.id,
    question: search,
    orderBy: sortedString,
    itemsPerPage: itemsPerPage.value,
    currentPage: currentPage,
  })
  const [createCard] = useCreateCardMutation()
  const [editItem] = useEditCardMutation()
  const [deleteItem] = useDeleteCardMutation()
  const [deleteDeck] = useDeletedDeckMutation()
  const [editDeck] = useUpdateDeckMutation()

  const openPackModal = (value: NameModal) => {
    dispatch(modalActions.setOpenModal(value))
    dispatch(modalActions.setPackName(data!.name))
    dispatch(modalActions.setPrivatePack(data!.isPrivate))
    setCardId(data!.id)
  }
  const setNewCurrentPage = (page: number) => {
    // dispatch(deckSlice.actions.setCurrentPageFriendsPack(page))
    dispatch(deckSlice.actions.setCurrentPageMyPack(page))
  }
  const setNewPerPage = (value: number) => {
    dispatch(deckSlice.actions.setItemsMyPackPerPage(value))
  }

  const addCardModalHandler = () => {
    dispatch(modalActions.setOpenModal('addCard'))
  }
  const addOrEditCard = () => {
    if (open === 'addCard') {
      const formData = new FormData()

      formData.append('question', question)
      formData.append('answer', answer)

      questionImg && formData.append('questionImg', questionImg)
      answerImg && formData.append('answerImg', answerImg)
      createCard({ id: params.id, formData })
    } else if (open === 'editCard') {
      const formData = new FormData()

      formData.append('question', question)
      formData.append('answer', answer)

      questionImg && formData.append('questionImg', questionImg)
      answerImg && formData.append('answerImg', answerImg)
      editItem({ id: cardId, formData })
        .unwrap()
        .then(() => toast.success('Карточка успешна обновлена'))
        .catch(() => {
          toast.error('Some error')
        })
    }
    dispatch(modalActions.setCloseModal({}))
    dispatch(modalActions.setClearState({}))
  }
  const deleteCardOrPack = () => {
    if (open === 'deleteCard') {
      deleteItem({ id: cardId })
    } else if (open === 'editPack') {
      editDeck({ id: cardId, name: packName, isPrivate: privatePack })
        .unwrap()
        .then(() => {
          toast.success('Колода успешно обновлена')
        })
        .catch(() => {
          toast.error('Some error')
        })
    } else if (open === 'deletePack') {
      deleteDeck({ id: cardId })
        .unwrap()
        .then(() => {
          toast.success('Карта успешно удалена')
        })
        .catch(() => {
          toast.error('Some error')
        })

      navigate('/')
    }
    dispatch(modalActions.setCloseModal({}))
    dispatch(modalActions.setClearState({}))
  }
  const editPack = () => {
    editDeck({ id: cardId, name: packName, isPrivate: privatePack })
      .unwrap()
      .then(() => {
        toast.success('Колода успешно обновлена')
      })
      .catch(() => {
        toast.error('Some error')
      })
    dispatch(modalActions.setCloseModal({}))
    dispatch(modalActions.setClearState({}))
  }

  const dropDownMenu = [
    {
      id: 1,
      component: (
        <Button as={Link} to={`/learn-pack/${params.id}`} variant={'link'} className={s.buttonDrop}>
          <Play />
          <Typography variant={'caption'}>Learn</Typography>
        </Button>
      ),
    },
    {
      id: 2,
      component: (
        <Button variant={'link'} className={s.buttonDrop} onClick={() => openPackModal('editPack')}>
          <Edit />
          <Typography variant={'caption'}>Edit</Typography>
        </Button>
      ),
    },
    {
      id: 3,
      component: (
        <Button
          variant={'link'}
          className={s.buttonDrop}
          onClick={() => openPackModal('deletePack')}
        >
          <Trash />
          <Typography variant={'caption'}>Delete</Typography>
        </Button>
      ),
    },
  ]

  if (isLoading) return <Loader />

  return (
    <div className={s.myPackBlock}>
      <Button as={Link} to="/" variant={'link'} className={s.backButton}>
        <Back />
        Back to Packs List
      </Button>
      <div className={s.headBlock}>
        <div className={s.titleAndCover}>
          <div className={s.titleMenu}>
            <Typography variant={'large'}>{data?.name}</Typography>
            <DropDownMenuDemo items={dropDownMenu} trigger={<SubMenu />} />
          </div>
          {data?.cover && <img src={data.cover} alt="cover" className={s.cover} />}
        </div>
        <Button variant={'primary'} onClick={addCardModalHandler}>
          Add New Card
        </Button>
      </div>
      <TextField
        value={search}
        onChangeText={event => setSearch(event)}
        onSearchClear={() => setSearch('')}
        type={'searchType'}
        className={s.textField}
      />
      <MyPackTable dataCards={dataCards} sort={sort} setSort={setSort} setCardId={setCardId} />
      <AddEditCardModal onSubmit={addOrEditCard} />
      <AddEditPackModal onSubmit={editPack} />
      <DeletePackCardModal onSubmit={deleteCardOrPack} />
      <div className={s.pagination}>
        <Pagination
          count={dataCards?.pagination.totalPages}
          page={currentPage}
          onChange={setNewCurrentPage}
        />
        <Typography variant={'body2'}>Показать</Typography>
        <SuperSelect
          options={options}
          defaultValue={itemsPerPage.value}
          onValueChange={setNewPerPage}
          classname={s.selectPagination}
        />
        <Typography variant={'body2'}>На странице</Typography>
      </div>
    </div>
  )
}
